export interface TranscriptLine { speaker?: string; text: string }

// Transcript paragraphs are "Speaker: dialogue" (see comicLoader.buildTranscript); narration has no speaker.
const SPEAKER = /^([A-Z][\w' ]{0,30}):\s+([\s\S]+)$/;

export function transcriptLines(transcript: string): TranscriptLine[] {
  return transcript.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => {
    const match = p.match(SPEAKER);
    return match ? { speaker: match[1], text: match[2] } : { text: p };
  });
}
