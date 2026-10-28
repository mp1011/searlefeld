---
status: Done
---

# GOAL

Create a Tool that allows a human and an agent to generate comics with a reliable style.

# Interaction Method

This is a command line tool which walks the user through stage of a comic creation process. At times, the CLI switches to a coding agent (in interactive mode), the user then terminates that session when they are done with the agent and want to move on to the next stage.

The stages of a comic creation are stored in repository tracked files: one folder per comic strip, with a json file indicating which stages have been complete.

The user interacts with a combination of menu prompts, LLM chats, and writing to specified files within the comic folder.

This tool exclusively uses Codex for anything requiring an LLM.

# Before a comic is made
   - User writes an outline of a comic into an md file in `agent_docs\comic_notes\situations`
   - this is not a concrete format. It is intended to be parsed by the LLM

# Tool Stages

1. Scaffolding
   - user provides the path to a file in `agent_docs\comic_notes\situations` 
   - a new folder is created in comic_src, using the format `000_filename` with an incrementing counter and using the same filename as the source md file
   - the following files are created
      - status.json - tells the tool what stage of the comic generation process we're up to
      - panels.json - an array of entries describing the panels. See `panels.json format` notes below. This file is just a "sample" with a default of four panels, and a default of two character per panel, however there is no detail filled out, only the field names.
   - the scaffolding stage is done by a tool, not an agent, so it won't have any knowledge of the comic itself
2. Panel Descriptions
   - done via a non-interactive agent prompt. "Read <path to panels.json>. Based on the source provided, decide how many panels the comic should contain. Fill out the json file describing the layout, background, characters, and speech.
   - the json file is checked for syntax errors, if any are found, the agent is again called non-interactively to fix them. Max of 3 retries until the human has to intervene
3. Panel Review
   - the human reads over panels.json, making any desired edits
   - the human may choose "edit panels.json interactively" which launchse an interactive agent prompt. "Work with the user to improve the contenst of <path to panels.json>. The user will specify what they want to change"
   - the user can approve the files with a menu option
4. Background Generation
   - a separate image file is created with a non-interactive agent prompt, one panel at a time
   - one file per panel, filename `00_background.png` with a 0-based index number
   - reference image provided, description not provided: take the reference image exactly as is, don't use an agent session at all
   - reference image and description provided: launch a non-interactive agent session with this prompt: "Create a comic background image of size <size determined from attributes of panel>, using reference image <path to reference image>. Additional adjustments: <text from "description">. Store the result in <00_background.png>"
   - description provided but no image reference:  "Create a comic background image of size <size determined from attributes of panel>. <text from "description">. Store the result in <00_background.png>"
   - ask the user for feedback after each image is generated, before moving onto the next:
      "Background image <destination path> created. Continue? (y/n)
         - if yes, move to next panel. If all panels are done, move to Stage 5.
         - if no, provide these options
            1. Tweak image with a prompt (if so opens an interactive session where user can explain what they want to change)
            2. Edit panels.json and re-generate (if so, repeats the image generation again after user confirms they've updated panels.json
5. Character Generation
- a separate image file is created with a non-interactive agent prompt, one panel at a time
- one file per panel, filename `00_background_and_character.png` with a 0-based index number
- images created with a non-interactive prompt. "Based on <##_background.png>, create a new image containing characters, but no speech. <generate prompt based on contents of panels.json>. Save result to <path to destination>"
- same continue or retry menu as the backgrounds

6. Speech
- Similar pattern to character generation, with filenames "00_background_character_speech.png"

7. Final touches
- Programatically stitch the frames together into a single image based on their layouts
- "comic_full.png"
- ask the user if they accept the final image as is. If not, an interactive image edit prompt is used which takes the image and creates a new one with the requested tweaks 
   


## panels.json format
```
{
   source: "relative path to md file in  `agent_docs\comic_notes\situations`
   title: string, title of the comic
   panels:
   [
      {
         width: (percent of total comic area)
         height: (percent of total comic area)
         row: (0-based integer)
         column: (0-based integer)
         background: 
         {
            reference: optional, path to reference images
            description: any deviations from the reference image, or a full description of not using a reference
         }
         characters: [
            {
               character: string, name of character
               action: string, what the character is doing. This includes position.
               mood: string, how the character is feeling
               dialogue: what the character is saying, if anything
            }
         ]

      }
   ]
}
```