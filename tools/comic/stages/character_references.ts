import type { PanelCharacter } from '../panels';

export interface CharacterReference {
  /** Path relative to agent_docs/comic_notes/reference_images/. */
  sheet: string;
  /** One-line look summary, used alongside the sheet. */
  look: string;
}

/** Add a row to give a character a reference sheet; names are matched case-insensitively. */
export const CHARACTER_REFERENCES: Record<string, CharacterReference> = {
  roko: { sheet: 'character/roko-turnaround-v1.png', look: 'tallest of the cast, horned, habitual slouch' },
  max: { sheet: 'character/max-turnaround-v1.png', look: 'mid-height, paperclip accessories' },
  ailan: { sheet: 'character/ailan-turnaround-v1.png', look: 'shortest of the cast, human presentation with robotic details' },
  'chinese room': {
    sheet: 'character/chinese-room-dot-matrix-expressions-v1.png',
    look: 'appears only as the wall monitor showing a dot-matrix face; no free-standing body',
  },
};

export function characterReference(name: string): CharacterReference | undefined {
  return CHARACTER_REFERENCES[name.trim().toLowerCase()];
}

/** One prompt line for a character; dialogue is deliberately never included. */
export function characterDescription(c: PanelCharacter, resolveSheet: (sheet: string) => string): string {
  const ref = characterReference(c.character);
  const parts = [`${c.character.trim()}: action: ${c.action.trim() || 'none'}; mood: ${c.mood.trim() || 'neutral'}`];
  if (ref) parts.push(`look: ${ref.look}; reference sheet: ${resolveSheet(ref.sheet)}`);
  return parts.join('; ');
}
