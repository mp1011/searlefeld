# Comic Pipeline to Website Integration

## Overview

Searlefeld's static website dynamically sources comic content directly from `comic_src/`, the output directory of the comic image generation toolchain (`tools/comic/`).

This decouples comic authoring from site maintenance: when an author creates or finishes a strip in `comic_src/`, the site automatically discovers and publishes it without requiring manual entry duplication or handwritten Markdown stubs.

## Pipeline Integration Architecture

```
comic_src/
├── 000_nvidia/
│   ├── status.json     # {"stage": 8}
│   ├── panels.json     # title, panel dialogue, metadata
│   └── comic_full.png  # stitched strip image
└── 001_human/
    ├── status.json     # {"stage": 8}
    ├── panels.json
    └── comic_full.png
         │
         ▼  (astro build / astro dev / astro check)
website/src/content.config.ts
         │
         ▼  comicSrcLoader() in website/src/lib/comicLoader.ts
   ┌────────────────────────────────────────────────────────┐
   │ 1. Filter: checks status.json (only stage === 8 loaded)│
   │ 2. Parse: extracts title, characters, publishDate, etc.│
   │ 3. Transcript: formats dialogue (<Speaker>: <text>)    │
   │ 4. Sync: copies comic_full.png to website/public/comics│
   │ 5. Store: populates Astro Content Collection entries   │
   └────────────────────────────────────────────────────────┘
```

## Discovery & Filtering Rules

1. **Stage 8 Requirement**: A comic directory in `comic_src/` is only loaded if `status.json` exists and its `stage` equals `8` (the final stage after human approval of stitched `comic_full.png`). Any incomplete or in-progress comic (stages 1–7) is ignored.
2. **Deterministic Numbering**: Comic numbers are assigned sequentially (1-based: 1, 2, ...) matching directory alphabetical order (`000_...`, `001_...`).
3. **Asset Synchronization**: `comic_full.png` is mirrored into `website/public/comics/` with standardized naming (`0001-nvidia.png`, `0002-human.png`), avoiding redundant copies when file size and mtime already match.
4. **Transcript Assembly**: The transcript is synthesized directly from `panels.json`. Each panel's characters with non-empty `dialogue` are formatted as `<Speaker>: <dialogue>`, separated by double newlines into accessible paragraphs.
5. **Character Tagging**: All unique characters appearing across panels are collected and validated against the cast schema (`roko`, `max`, `ailan`, `chinese_room`, `other`), enabling automatic cast appearance tracking on `/about`.
