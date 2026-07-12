import type { Screenplay } from '../model/screenplay';

const strip = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .trim();

/** Character-name suggestions for smart-type: unique cues from the script,
    most recently used first, prefix matched without case or accents. */
export function suggestCharacters(screenplay: Screenplay, prefix: string): string[] {
  const p = strip(prefix);
  const lastUse = new Map<string, number>();
  let i = 0;
  for (const scene of screenplay.scenes) {
    for (const element of scene.elements) {
      if (element.type !== 'character') continue;
      const name = element.text.trim().toUpperCase();
      if (name.length === 0) continue;
      lastUse.set(name, i++);
    }
  }
  return [...lastUse.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
    .filter((name) => {
      if (p.length === 0) return true;
      const n = strip(name);
      return n.startsWith(p) && n !== p;
    });
}
