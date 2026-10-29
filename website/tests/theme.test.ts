import { describe, expect, it } from 'vitest';
import { contrastRatio, darkTheme, lightTheme, themeCss, type Theme, type ThemeToken } from '../src/lib/theme';

// Every text-on-background pairing the site actually renders.
const textPairs: [ThemeToken, ThemeToken][] = [
  ['fg', 'bg'], ['fg', 'surface'], ['muted', 'bg'], ['muted', 'surface'],
  ['accentText', 'bg'], ['accentText', 'surface'], ['accentInk', 'accentText'],
  ['sage', 'bg'], ['sage', 'surface'],
];

describe('contrastRatio', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
    expect(contrastRatio('#ffffff', '#777777')).toBeCloseTo(contrastRatio('#777777', '#ffffff'), 10);
  });
});

describe.each([['light', lightTheme], ['dark', darkTheme]] as [string, Theme][])('%s theme', (_name, theme) => {
  it.each(textPairs)('%s text on %s meets WCAG AA', (text, background) => {
    expect(contrastRatio(theme[text], theme[background])).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the orange accent visible as a border against the page', () => {
    expect(contrastRatio(theme.accent, theme.bg)).toBeGreaterThanOrEqual(3);
  });
});

describe('themeCss', () => {
  it('defines the same tokens in both themes', () => {
    expect(Object.keys(darkTheme).sort()).toEqual(Object.keys(lightTheme).sort());
    expect(Object.keys(lightTheme).length).toBeGreaterThan(0);
  });

  it('puts light values on :root and dark values inside the dark color-scheme query', () => {
    const css = themeCss();
    const query = css.indexOf('@media (prefers-color-scheme: dark)');
    expect(query).toBeGreaterThan(0);
    const light = css.slice(0, query);
    const dark = css.slice(query);
    expect(light).toContain(`--bg: ${lightTheme.bg};`);
    expect(light).toContain(`--accent-text: ${lightTheme.accentText};`);
    expect(dark).toContain(`--bg: ${darkTheme.bg};`);
    expect(dark).toContain(`--accent-text: ${darkTheme.accentText};`);
    expect(dark).toContain('color-scheme: dark');
  });
});
