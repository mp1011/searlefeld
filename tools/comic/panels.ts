export interface PanelCharacter {
  character: string;
  action: string;
  mood: string;
  dialogue: string;
}

export interface PanelBackground {
  reference?: string;
  description: string;
}

export interface Panel {
  width: number;
  height: number;
  row: number;
  column: number;
  background: PanelBackground;
  characters: PanelCharacter[];
}

export interface Panels {
  source: string;
  title: string;
  panels: Panel[];
}

const DEFAULT_PANELS = 4;
const DEFAULT_CHARACTERS = 2;

/** The "sample" panels.json: every field present, no comic content. */
export function panelsTemplate(source: string): Panels {
  const character = (): PanelCharacter => ({ character: '', action: '', mood: '', dialogue: '' });
  const panel = (i: number): Panel => ({
    width: 0,
    height: 0,
    row: Math.floor(i / 2),
    column: i % 2,
    background: { reference: '', description: '' },
    characters: Array.from({ length: DEFAULT_CHARACTERS }, character),
  });
  return { source, title: '', panels: Array.from({ length: DEFAULT_PANELS }, (_, i) => panel(i)) };
}

function lineAndColumn(text: string, position: number): string {
  const before = text.slice(0, position);
  const line = before.split('\n').length;
  const column = position - before.lastIndexOf('\n');
  return `line ${line}, column ${column}`;
}

function syntaxMessage(text: string, e: Error): string {
  const m = /position (\d+)/.exec(e.message);
  const where = m ? ` at ${lineAndColumn(text, Number(m[1]))}` : '';
  return `JSON syntax error${where}: ${e.message}`;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function checkString(obj: Record<string, unknown>, key: string, path: string, errors: string[], optional = false): void {
  if (obj[key] === undefined && optional) return;
  if (typeof obj[key] !== 'string') errors.push(`${path}.${key} must be a string`);
}

function checkNumber(
  obj: Record<string, unknown>, key: string, path: string, errors: string[],
  max: number | undefined, integer: boolean,
): void {
  const v = obj[key];
  if (typeof v !== 'number' || Number.isNaN(v)) return void errors.push(`${path}.${key} must be a number`);
  if (integer && !Number.isInteger(v)) errors.push(`${path}.${key} must be an integer`);
  if (v < 0 || (max !== undefined && v > max)) {
    errors.push(`${path}.${key} must be between 0 and ${max ?? 'infinity'} (got ${v})`);
  }
}

function validateCharacter(c: unknown, path: string, errors: string[]): void {
  if (!isObject(c)) return void errors.push(`${path} must be an object`);
  for (const key of ['character', 'action', 'mood', 'dialogue']) checkString(c, key, path, errors);
}

function validatePanel(p: unknown, path: string, errors: string[]): void {
  if (!isObject(p)) return void errors.push(`${path} must be an object`);
  checkNumber(p, 'width', path, errors, 100, false);
  checkNumber(p, 'height', path, errors, 100, false);
  checkNumber(p, 'row', path, errors, undefined, true);
  checkNumber(p, 'column', path, errors, undefined, true);
  if (!isObject(p.background)) {
    errors.push(`${path}.background must be an object`);
  } else {
    checkString(p.background, 'reference', `${path}.background`, errors, true);
    checkString(p.background, 'description', `${path}.background`, errors);
  }
  if (!Array.isArray(p.characters)) {
    errors.push(`${path}.characters must be an array`);
  } else {
    p.characters.forEach((c, i) => validateCharacter(c, `${path}.characters[${i}]`, errors));
  }
}

/** Returns readable error messages; an empty array means the text is a valid panels.json. */
export function validatePanels(text: string): string[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return [syntaxMessage(text, e as Error)];
  }
  if (!isObject(data)) return ['panels.json must contain a JSON object'];
  const errors: string[] = [];
  checkString(data, 'source', 'panels', errors);
  checkString(data, 'title', 'panels', errors);
  if (!Array.isArray(data.panels)) {
    errors.push('panels.panels must be an array');
  } else {
    data.panels.forEach((p, i) => validatePanel(p, `panels.panels[${i}]`, errors));
  }
  return errors;
}

/** Loads and validates panels.json; throws one Error listing every problem. */
export function loadPanels(text: string): Panels {
  const errors = validatePanels(text);
  if (errors.length > 0) throw new Error(`Invalid panels.json:\n- ${errors.join('\n- ')}`);
  return JSON.parse(text) as Panels;
}
