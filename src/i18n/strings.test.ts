import { describe, expect, it } from 'vitest';
import { dictionaries } from './strings';

describe('string dictionaries', () => {
  it('English and Spanish carry exactly the same keys', () => {
    const en = Object.keys(dictionaries.en).sort();
    const es = Object.keys(dictionaries.es).sort();
    expect(es).toEqual(en);
  });

  it('no dictionary entry is empty', () => {
    for (const lang of ['en', 'es'] as const) {
      for (const [key, value] of Object.entries(dictionaries[lang])) {
        expect(value.trim(), `${lang}:${key}`).not.toBe('');
      }
    }
  });
});
