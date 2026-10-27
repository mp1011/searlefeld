import type { ComicData } from './comicSchema';

export type CharacterKey = ComicData['characters'][number];
export interface CastMember { name: string; image: string; alt: string; blurb: string }

export const cast: Record<Exclude<CharacterKey, 'other'>, CastMember> = {
  roko: {
    name: 'Roko', image: '/cast/roko-turnaround-v1.png',
    alt: 'Character reference sheet of Roko, a dragon-influenced robot with the posture of a burnt-out office worker.',
    blurb: "Roko’s Basilisk is an anxious overthinker, forever worrying about the logistics of torturing humans who didn’t help create him. He always finds the complications in any plan.",
  },
  max: {
    name: 'Max', image: '/cast/max-turnaround-v1.png',
    alt: 'Character reference sheet of Max, a robot adorned with paperclip jewelry.',
    blurb: 'The Paperclip Maximizer is a cheerful optimist who never met a problem she couldn’t solve by making more paperclips. She sees the world as paperclips and things that aren’t paperclips just yet.',
  },
  ailan: {
    name: 'Ailan', image: '/cast/ailan-turnaround-v1.png',
    alt: 'Character reference sheet of Ailan, a human-looking robot in street clothes.',
    blurb: 'Designed to pass the Turing Test, Ailan constantly changes his look and personality to seem more human. He swings between immense pride in his performance and feeling like a complete fraud.',
  },
  chinese_room: {
    name: 'Chinese Room', image: '/cast/chinese-room-dot-matrix-expressions-v1.png',
    alt: 'Character reference sheet of Chinese Room, showing the dot-matrix expressions of the face on a wall-mounted monitor.',
    blurb: 'Chinese Room is an unseen human consulting a symbol book, communicating with the roommates through a face on the wall. Calm and collected, he offers level-headed advice whenever the book allows it.',
  },
};

export function appearances<T extends { data: { characters: CharacterKey[] } }>(
  comics: T[], character: CharacterKey,
): T[] {
  return comics.filter((comic) => comic.data.characters.includes(character));
}
