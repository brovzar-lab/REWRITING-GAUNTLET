import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { paginate } from './engine';
import { fingerprint, rulesGoldenScreenplay } from './fingerprint';
import { sampleScreenplay } from '../model/sample/gauntlet-sample';

const root = process.cwd();

describe('golden pagination fixtures', () => {
  it('the sample screenplay paginates to at least 8 pages', () => {
    expect(paginate(sampleScreenplay).pageCount).toBeGreaterThanOrEqual(8);
  });

  it('rules fixture matches its golden file exactly', () => {
    const golden = JSON.parse(readFileSync(resolve(root, 'src/pagination/fixtures/rules-golden.json'), 'utf8'));
    expect(fingerprint(rulesGoldenScreenplay())).toEqual(golden);
  });

  it('LAS GARZAS matches its golden file exactly', () => {
    const golden = JSON.parse(readFileSync(resolve(root, 'src/pagination/fixtures/las-garzas-golden.json'), 'utf8'));
    expect(fingerprint(sampleScreenplay)).toEqual(golden);
  });

  it('no rendered continuation line ever contains a curly apostrophe', () => {
    const r = paginate(sampleScreenplay);
    for (const page of r.pages) {
      for (const line of page.lines) {
        if (line.kind === 'more' || line.kind === 'contd') {
          expect(line.text).not.toContain('’');
        }
      }
    }
  });
});
