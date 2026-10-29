import { describe, expect, it } from 'vitest';
import {
  buildTranscript,
  extractCharacters,
  parseComicMetadata,
  scanComicSrc,
  type RawPanelsJson,
} from '../src/lib/comicLoader';
import { comicSchema } from '../src/lib/comicSchema';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('buildTranscript', () => {
  it('formats non-empty dialogue as Speaker: Dialogue separated by blank lines', () => {
    const panels = [
      {
        characters: [
          { character: 'roko', dialogue: "Guys I'm losing my mind." },
          { character: 'max', dialogue: '' },
        ],
      },
      {
        characters: [
          { character: 'chinese_room', dialogue: "Take a break." },
          { character: 'roko', dialogue: 'Thanks!' },
        ],
      },
    ];
    const transcript = buildTranscript(panels);
    expect(transcript).toBe(
      "Roko: Guys I'm losing my mind.\n\nChinese Room: Take a break.\n\nRoko: Thanks!",
    );
  });

  it('handles unknown or other characters cleanly', () => {
    const panels = [
      {
        characters: [{ character: 'coffee_bot', dialogue: 'More java?' }],
      },
    ];
    expect(buildTranscript(panels)).toBe('Coffee Bot: More java?');
  });

  it('returns empty string if no dialogue in comic', () => {
    expect(buildTranscript([{ characters: [{ character: 'max', dialogue: '' }] }])).toBe('');
  });
});

describe('extractCharacters', () => {
  it('returns unique valid characters in appearance order', () => {
    const panels = [
      {
        characters: [
          { character: 'roko' },
          { character: 'max' },
        ],
      },
      {
        characters: [
          { character: 'roko' },
          { character: 'chinese_room' },
        ],
      },
    ];
    expect(extractCharacters(panels)).toEqual(['roko', 'max', 'chinese_room']);
  });
});

describe('parseComicMetadata', () => {
  const samplePanels: RawPanelsJson = {
    title: 'Credit Where Due',
    publishDate: '2026-01-01',
    altText: 'Custom alt text',
    panels: [
      {
        characters: [
          { character: 'roko', dialogue: 'Help!' },
        ],
      },
    ],
  };

  it('produces valid ComicData schema matching comicSchema', () => {
    const { id, data, transcript } = parseComicMetadata(
      '000_nvidia',
      samplePanels,
      1,
      '/comics/0001-nvidia.png',
    );
    expect(id).toBe('0001-nvidia');
    expect(comicSchema.safeParse(data).success).toBe(true);
    expect(data.comicNumber).toBe(1);
    expect(data.title).toBe('Credit Where Due');
    expect(data.altText).toBe('Custom alt text');
    expect(data.image).toBe('/comics/0001-nvidia.png');
    expect(transcript).toBe('Roko: Help!');
  });

  it('falls back to title when altText is omitted and omits publishDate when unspecified', () => {
    const { altText, publishDate, ...minimal } = samplePanels;
    const { data } = parseComicMetadata('000_nvidia', minimal as RawPanelsJson, 1, '/comics/0001-nvidia.png');
    expect(data.altText).toBe('Credit Where Due');
    expect(data.publishDate).toBeUndefined();
  });
});

describe('scanComicSrc', () => {
  it('loads only directories whose status.json has stage 8', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'searlefeld-test-'));
    try {
      // 000_stage8 (should be included)
      const dir0 = join(tempDir, '000_stage8');
      mkdirSync(dir0, { recursive: true });
      writeFileSync(join(dir0, 'status.json'), JSON.stringify({ stage: 8, completed: [1, 2, 3, 4, 5, 6, 7] }));
      writeFileSync(
        join(dir0, 'panels.json'),
        JSON.stringify({
          title: 'Finished Comic',
          publishDate: '2026-01-01',
          panels: [{ characters: [{ character: 'max', dialogue: 'Hi' }] }],
        }),
      );
      writeFileSync(join(dir0, 'comic_full.png'), 'fake-png-content');

      // 001_wip (stage 5 - should be skipped)
      const dir1 = join(tempDir, '001_wip');
      mkdirSync(dir1, { recursive: true });
      writeFileSync(join(dir1, 'status.json'), JSON.stringify({ stage: 5, completed: [1, 2, 3, 4] }));
      writeFileSync(
        join(dir1, 'panels.json'),
        JSON.stringify({ title: 'WIP Comic', panels: [] }),
      );

      // 002_stage8 (should be included)
      const dir2 = join(tempDir, '002_stage8');
      mkdirSync(dir2, { recursive: true });
      writeFileSync(join(dir2, 'status.json'), JSON.stringify({ stage: 8, completed: [1, 2, 3, 4, 5, 6, 7] }));
      writeFileSync(
        join(dir2, 'panels.json'),
        JSON.stringify({
          title: 'Another Finished Comic',
          publishDate: '2026-01-08',
          panels: [{ characters: [{ character: 'ailan', dialogue: 'Hello' }] }],
        }),
      );
      writeFileSync(join(dir2, 'comic_full.png'), 'fake-png-content-2');

      const records = scanComicSrc(tempDir);
      expect(records).toHaveLength(2);
      expect(records[0].dirName).toBe('000_stage8');
      expect(records[0].comicNumber).toBe(1);
      expect(records[0].data.title).toBe('Finished Comic');
      expect(records[1].dirName).toBe('002_stage8');
      expect(records[1].comicNumber).toBe(2);
      expect(records[1].data.title).toBe('Another Finished Comic');
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
