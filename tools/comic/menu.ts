import { createInterface } from 'node:readline/promises';

export type Ask = (question: string) => Promise<string>;

export function createAsk(): { ask: Ask; close: () => void } {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return { ask: (q) => rl.question(q), close: () => rl.close() };
}

/** Shows numbered options and returns the chosen 0-based index (re-asks on bad input). */
export async function chooseOption(ask: Ask, title: string, options: string[]): Promise<number> {
  for (;;) {
    const lines = options.map((o, i) => `  ${i + 1}. ${o}`).join('\n');
    const n = Number((await ask(`${title}\n${lines}\n> `)).trim());
    if (Number.isInteger(n) && n >= 1 && n <= options.length) return n - 1;
  }
}
