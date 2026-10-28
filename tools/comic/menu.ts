import { createInterface } from 'node:readline/promises';

export type Ask = (question: string) => Promise<string>;

/**
 * One readline interface per question: a long-lived one keeps reading stdin while an interactive
 * child (Codex) owns the terminal, and echoes its terminal replies back as phantom keypresses.
 */
export function createAsk(): { ask: Ask; close: () => void } {
  const ask: Ask = async (q) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      return await rl.question(q);
    } finally {
      rl.close();
    }
  };
  return { ask, close: () => process.stdin.pause() };
}

/** Shows numbered options and returns the chosen 0-based index (re-asks on bad input). */
export async function chooseOption(ask: Ask, title: string, options: string[]): Promise<number> {
  for (;;) {
    const lines = options.map((o, i) => `  ${i + 1}. ${o}`).join('\n');
    const n = Number((await ask(`${title}\n${lines}\n> `)).trim());
    if (Number.isInteger(n) && n >= 1 && n <= options.length) return n - 1;
  }
}
