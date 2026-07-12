import { paginate } from './engine';
import { fx, actionLines, dialogueLines } from './fixtures/rules-fixture';
import type { Screenplay } from '../model/screenplay';

/** Serializable fingerprint of a pagination result. Any change to a page
    break, split, or continuation shows up here and fails loudly. */
export function fingerprint(screenplay: Screenplay) {
  const r = paginate(screenplay);
  return {
    pageCount: r.pageCount,
    breakBeforeElement: [...r.breakBeforeElement].sort(),
    splitElements: Object.fromEntries([...r.splitElements.entries()].sort(([a], [b]) => a.localeCompare(b))),
    moreContdPairs: r.pages.flatMap((p) =>
      p.lines.filter((l) => l.kind === 'contd').map((l) => `${p.number}:${l.text}`),
    ),
    bodyLinesPerPage: r.pages.map((p) => p.lines.filter((l) => l.kind !== 'page_header').length),
  };
}

/** The synthetic golden screenplay: mixes every break rule in one document. */
export function rulesGoldenScreenplay(): Screenplay {
  return fx([
    [['scene_heading', 'INT. ONE - DAY'], ['action', actionLines(51)]],
    [['scene_heading', 'INT. TWO - DAY'], ['action', actionLines(46)], ['character', 'MARISOL'], ['dialogue', dialogueLines(30)]],
    [['scene_heading', 'INT. THREE - NIGHT'], ['action', actionLines(20)], ['character', 'LUPITA'], ['parenthetical', '(soft)'], ['dialogue', dialogueLines(8)], ['action', actionLines(10)], ['transition', 'CUT TO:']],
    [['scene_heading', 'EXT. FOUR - DAWN'], ['action', actionLines(120)]],
  ]);
}
