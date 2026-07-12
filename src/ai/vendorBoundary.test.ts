import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Architecture guard: no module outside src/ai/adapters/ may name the AI
    vendor. Everything else programs against the AIProvider interface, so the
    vendor can be swapped without touching the rest of the app. */

const SRC = join(__dirname, '..');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

describe('AI vendor boundary', () => {
  it('no src module outside src/ai/adapters names the vendor', () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const rel = relative(SRC, file);
      if (rel.startsWith(`ai${sep}adapters${sep}`)) continue;
      if (rel === `ai${sep}vendorBoundary.test.ts`) continue; // this guard names the pattern it hunts
      const content = readFileSync(file, 'utf8');
      if (/anthropic/i.test(content)) offenders.push(rel);
    }
    expect(offenders).toEqual([]);
  });
});
