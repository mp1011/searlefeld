import { expect, it } from 'vitest';
import { transcriptLines } from '../src/lib/transcript';

it('splits each paragraph into speaker and line', () => {
  expect(transcriptLines('Ailan: Hey gang!\n\nMax: A human? What are you doing here?')).toEqual([
    { speaker: 'Ailan', text: 'Hey gang!' },
    { speaker: 'Max', text: 'A human? What are you doing here?' },
  ]);
});

it('splits only at the first colon so dialogue can contain colons', () => {
  expect(transcriptLines('Chinese Room: Rule 7: reply "yes" at 3:00.')).toEqual([
    { speaker: 'Chinese Room', text: 'Rule 7: reply "yes" at 3:00.' },
  ]);
});

it('keeps narration without a speaker as plain text and drops blank paragraphs', () => {
  expect(transcriptLines('  The apartment is quiet.  \n\n\n\nhttps://example.com is a link')).toEqual([
    { text: 'The apartment is quiet.' },
    { text: 'https://example.com is a link' },
  ]);
  expect(transcriptLines('')).toEqual([]);
});
