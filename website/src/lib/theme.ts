export type ThemeToken = 'bg' | 'surface' | 'fg' | 'muted' | 'line' | 'accent' | 'accentText' | 'accentInk' | 'sage';
export type Theme = Record<ThemeToken, string>;

// Warm loft palette taken from the artwork: cream walls, espresso wood, logo orange, sofa sage.
// `accent` is for fills, borders and rules; `accentText` is the AA-legible orange for text and hover fills.
export const lightTheme: Theme = {
  bg: '#f7f0e3', surface: '#fffaf1', fg: '#2e2219', muted: '#6e5b48', line: '#dcc9aa',
  accent: '#d9661a', accentText: '#a84a0c', accentInk: '#fff8ee', sage: '#4f6b4d',
};

export const darkTheme: Theme = {
  bg: '#1e1813', surface: '#2a211a', fg: '#f1e6d4', muted: '#b9a58c', line: '#4a3b2d',
  accent: '#f08a33', accentText: '#f39a4c', accentInk: '#24170c', sage: '#93ad8f',
};

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio between two `#rrggbb` colors. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const cssName = (token: string) => `--${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
const declarations = (theme: Theme) => Object.entries(theme).map(([k, v]) => `${cssName(k)}: ${v};`).join(' ');

/** Global custom properties: light on `:root`, dark when the visitor's system prefers it. */
export function themeCss(): string {
  return `:root { ${declarations(lightTheme)} color-scheme: light; }\n`
    + `@media (prefers-color-scheme: dark) { :root { ${declarations(darkTheme)} color-scheme: dark; } }`;
}
