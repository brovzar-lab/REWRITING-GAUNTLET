import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { load } from 'js-yaml';

interface DesignFrontmatter {
  colors: Record<string, string>;
  typography: Record<
    string,
    { fontFamily: string; fontSize: string; fontWeight: number; lineHeight: number; letterSpacing?: string }
  >;
  rounded: Record<string, string>;
  spacing: Record<string, string>;
}

interface DesignJson {
  extensions: {
    shadows: { name: string; value: string }[];
    motion: { name: string; value: string }[];
    breakpoints: { name: string; value: string }[];
  };
}

const root = resolve(__dirname, '../..');
const tokensCss = readFileSync(resolve(root, 'src/theme/tokens.css'), 'utf8');
const designMd = readFileSync(resolve(root, 'DESIGN.md'), 'utf8');
const designJson: DesignJson = JSON.parse(readFileSync(resolve(root, 'DESIGN.json'), 'utf8'));

const frontmatterMatch = designMd.match(/^---\n([\s\S]*?)\n---/);
if (!frontmatterMatch) throw new Error('DESIGN.md frontmatter not found');
const fm = load(frontmatterMatch[1]) as DesignFrontmatter;

/** Assert a custom property is declared with the exact value (whitespace-tolerant). */
function expectToken(name: string, value: string) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${name}\\s*:\\s*${escaped}\\s*;`);
  expect(tokensCss).toMatch(re);
}

describe('tokens.css carries every DESIGN token verbatim', () => {
  it('declares every color from DESIGN.md frontmatter', () => {
    for (const [key, hex] of Object.entries(fm.colors)) {
      expectToken(`--color-${key}`, hex);
    }
  });

  it('declares typography tokens', () => {
    for (const [key, t] of Object.entries(fm.typography)) {
      expectToken(`--font-size-${key}`, t.fontSize);
      expectToken(`--font-weight-${key}`, String(t.fontWeight));
      expectToken(`--line-height-${key}`, String(t.lineHeight));
    }
    expect(tokensCss).toContain('Courier Prime');
    expect(tokensCss).toContain('Inter');
  });

  it('declares radius and spacing tokens', () => {
    for (const [key, v] of Object.entries(fm.rounded)) expectToken(`--rounded-${key}`, v);
    for (const [key, v] of Object.entries(fm.spacing)) expectToken(`--space-${key}`, v);
  });

  it('declares shadows, motion, and breakpoints from DESIGN.json', () => {
    for (const s of designJson.extensions.shadows) expectToken(`--shadow-${s.name}`, s.value);
    for (const m of designJson.extensions.motion) expectToken(`--motion-${m.name}`, m.value);
    for (const b of designJson.extensions.breakpoints) expectToken(`--breakpoint-${b.name}`, b.value);
  });
});
