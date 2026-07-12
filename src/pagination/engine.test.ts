import { describe, expect, it } from 'vitest';
import { LINES_PER_PAGE, paginate } from './engine';
import { actionLines, dialogueLines, fx } from './fixtures/rules-fixture';
import type { PageModel } from './types';

function bodyLines(page: PageModel) {
  return page.lines.filter((l) => l.kind !== 'page_header');
}

function lastContentLine(page: PageModel) {
  const body = bodyLines(page).filter((l) => l.kind !== 'blank');
  return body[body.length - 1];
}

describe('page geometry', () => {
  it('every page holds at most 55 body lines; the header never counts', () => {
    const r = paginate(fx([[['scene_heading', 'INT. ROOM - DAY'], ['action', actionLines(200)]]]));
    for (const page of r.pages) {
      expect(bodyLines(page).length).toBeLessThanOrEqual(LINES_PER_PAGE);
    }
  });

  it('page 1 has no header; pages 2+ begin with a page_header line showing "N."', () => {
    const r = paginate(fx([[['scene_heading', 'INT. ROOM - DAY'], ['action', actionLines(200)]]]));
    expect(r.pageCount).toBeGreaterThan(1);
    expect(r.pages[0].lines[0].kind).not.toBe('page_header');
    for (const page of r.pages.slice(1)) {
      expect(page.lines[0].kind).toBe('page_header');
      expect(page.lines[0].text).toBe(`${page.number}.`);
    }
  });

  it('a blank line separates elements, but not inside a dialogue stack', () => {
    const r = paginate(
      fx([[['scene_heading', 'INT. ROOM - DAY'], ['action', 'She waits.'], ['character', 'ANA'], ['parenthetical', '(soft)'], ['dialogue', 'Ready.'], ['action', 'He nods.']]]),
    );
    const kinds = r.pages[0].lines.map((l) => `${l.kind}:${l.text.slice(0, 4)}`);
    expect(kinds).toEqual([
      'text:INT.',
      'blank:',
      'text:She ',
      'blank:',
      'text:ANA',
      'text:(sof',
      'text:Read',
      'blank:',
      'text:He n',
    ]);
  });
});

describe('rule 1: heading or transition never ends a page', () => {
  it('pushes a scene heading that would be the last body line', () => {
    // 1 (heading) + 1 (blank) + 51 (action) = 53; blank(54) + heading(55) would end the page.
    const sp = fx([
      [['scene_heading', 'INT. ONE - DAY'], ['action', actionLines(51)]],
      [['scene_heading', 'INT. TWO - DAY'], ['action', 'Something happens.']],
    ]);
    const r = paginate(sp);
    const heading2 = sp.scenes[1].elements[0];
    expect(r.pageOfElement.get(heading2.id)).toBe(2);
    expect(lastContentLine(r.pages[0]).elementId).not.toBe(heading2.id);
    expect(r.breakBeforeElement.has(heading2.id)).toBe(true);
  });

  it('pushes a transition that would be the last body line', () => {
    const sp = fx([
      [['scene_heading', 'INT. ONE - DAY'], ['action', actionLines(51)], ['transition', 'CUT TO:']],
      [['scene_heading', 'INT. TWO - DAY'], ['action', 'Later.']],
    ]);
    const r = paginate(sp);
    const transition = sp.scenes[0].elements[2];
    expect(r.pageOfElement.get(transition.id)).toBe(2);
  });
});

describe('rule 2: character cue stays with its dialogue', () => {
  it('pushes the whole stack when no dialogue line fits under the cue', () => {
    // heading(1) blank(2) action 51 (=53) blank(54) cue(55) -> no room for dialogue.
    const sp = fx([
      [['scene_heading', 'INT. ONE - DAY'], ['action', actionLines(51)], ['character', 'MARISOL'], ['dialogue', dialogueLines(4)]],
    ]);
    const r = paginate(sp);
    const cue = sp.scenes[0].elements[2];
    expect(r.pageOfElement.get(cue.id)).toBe(2);
    const page1Last = lastContentLine(r.pages[0]);
    expect(page1Last.elementId).not.toBe(cue.id);
  });

  it('pushes the stack when only one dialogue line would fit (minimum is two)', () => {
    // heading(1) blank(2) action 50 (=52) blank(53) cue(54) dialogue line(55) -> only 1 fits.
    const sp = fx([
      [['scene_heading', 'INT. ONE - DAY'], ['action', actionLines(50)], ['character', 'MARISOL'], ['dialogue', dialogueLines(6)]],
    ]);
    const r = paginate(sp);
    expect(r.pageOfElement.get(sp.scenes[0].elements[2].id)).toBe(2);
  });
});

describe('rule 3: dialogue splits with (MORE) / NAME (CONT\'D)', () => {
  it('splits a long speech, reserving a body line for (MORE)', () => {
    // heading(1) blank(2) action 46 (=48) blank(49) cue(50) leaves 5 body lines:
    // dialogue occupies 51-54 (4 lines) and (MORE) takes 55.
    const sp = fx([
      [['scene_heading', 'INT. ONE - DAY'], ['action', actionLines(46)], ['character', 'MARISOL'], ['dialogue', dialogueLines(30)]],
    ]);
    const r = paginate(sp);
    const dialogue = sp.scenes[0].elements[3];

    const page1Body = bodyLines(r.pages[0]);
    const more = page1Body[page1Body.length - 1];
    expect(more.kind).toBe('more');
    expect(more.text).toBe('(MORE)');
    expect(page1Body.filter((l) => l.elementId === dialogue.id && l.kind === 'text').length).toBe(4);

    const page2 = r.pages[1];
    const contd = page2.lines.find((l) => l.kind === 'contd')!;
    expect(contd.text).toBe("MARISOL (CONT'D)");
    expect(r.splitElements.get(dialogue.id)).toBe(4);
    // remaining 26 dialogue lines land on page 2
    expect(bodyLines(page2).filter((l) => l.elementId === dialogue.id && l.kind === 'text').length).toBe(26);
  });

  it('uses plain ASCII apostrophe in (CONT\'D), never curly', () => {
    const sp = fx([
      [['scene_heading', 'INT. ONE - DAY'], ['action', actionLines(46)], ['character', 'MARISOL'], ['dialogue', dialogueLines(30)]],
    ]);
    const r = paginate(sp);
    const all = r.pages.flatMap((p) => p.lines.map((l) => l.text)).join('\n');
    expect(all).not.toContain('’');
    expect(all).toContain("(CONT'D)");
  });

  it('pushes the stack instead of splitting when fewer than two dialogue lines would stay', () => {
    // heading(1) blank(2) action 48 (=50) blank(51) cue(52) leaves 3 lines:
    // 2 dialogue + (MORE)=ok is the minimum; with action 49 only 1 dialogue line + MORE -> push.
    const sp = fx([
      [['scene_heading', 'INT. ONE - DAY'], ['action', actionLines(49)], ['character', 'MARISOL'], ['dialogue', dialogueLines(10)]],
    ]);
    const r = paginate(sp);
    expect(r.pageOfElement.get(sp.scenes[0].elements[2].id)).toBe(2);
    expect(r.pages[0].lines.every((l) => l.kind !== 'more')).toBe(true);
  });

  it('allows the minimum legal split: two lines stay, (MORE) fills the last line', () => {
    const sp = fx([
      [['scene_heading', 'INT. ONE - DAY'], ['action', actionLines(48)], ['character', 'MARISOL'], ['dialogue', dialogueLines(10)]],
    ]);
    const r = paginate(sp);
    const dialogue = sp.scenes[0].elements[3];
    expect(r.splitElements.get(dialogue.id)).toBe(2);
    expect(bodyLines(r.pages[0]).length).toBe(LINES_PER_PAGE);
  });
});

describe('rule 2/3 combined: cue + parenthetical + dialogue near the page bottom', () => {
  it('keeps cue, parenthetical, and two dialogue lines together before (MORE)', () => {
    // heading(1) blank(2) action 47 (=49) blank(50) cue(51) paren(52) dial 53,54 + MORE(55)
    const sp = fx([
      [['scene_heading', 'INT. ONE - DAY'], ['action', actionLines(47)], ['character', 'CARMEN'], ['parenthetical', '(soft)'], ['dialogue', dialogueLines(10)]],
    ]);
    const r = paginate(sp);
    const [cue, paren, dialogue] = sp.scenes[0].elements.slice(2);
    expect(r.pageOfElement.get(cue.id)).toBe(1);
    expect(r.pageOfElement.get(paren.id)).toBe(1);
    const page1 = bodyLines(r.pages[0]);
    expect(page1.filter((l) => l.elementId === dialogue.id && l.kind === 'text').length).toBe(2);
    expect(page1[page1.length - 1].kind).toBe('more');
  });

  it('never lets a (MORE) line follow zero dialogue lines', () => {
    // sweep action padding so the stack lands at every offset around the page bottom
    for (let pad = 42; pad <= 53; pad++) {
      const sp = fx([
        [['scene_heading', 'INT. ONE - DAY'], ['action', actionLines(pad)], ['character', 'CARMEN'], ['parenthetical', '(low, not looking at her)'], ['dialogue', dialogueLines(6)]],
      ]);
      const r = paginate(sp);
      for (const page of r.pages) {
        const body = bodyLines(page).filter((l) => l.kind !== 'blank');
        const moreIdx = body.findIndex((l) => l.kind === 'more');
        if (moreIdx === -1) continue;
        const dialogueBefore = body
          .slice(0, moreIdx)
          .filter((l) => l.kind === 'text' && typeOf(l.elementId) === 'dialogue').length;
        expect(dialogueBefore, `pad=${pad} page=${page.number}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  function typeOf(elementId: string) {
    return elementId.includes('-e5') ? 'dialogue' : 'other';
  }
});

describe('rule 4: parenthetical never splits', () => {
  it('pushes the whole stack when the break would land inside cue+parenthetical', () => {
    // heading(1) blank(2) action 50 (=52) blank(53) cue(54) paren(55) -> dialogue would
    // start next page; paren must not be stranded/split, so the stack pushes.
    const sp = fx([
      [['scene_heading', 'INT. ONE - DAY'], ['action', actionLines(50)], ['character', 'MARISOL'], ['parenthetical', '(quiet, in Spanish)'], ['dialogue', dialogueLines(6)]],
    ]);
    const r = paginate(sp);
    expect(r.pageOfElement.get(sp.scenes[0].elements[2].id)).toBe(2);
    expect(r.pageOfElement.get(sp.scenes[0].elements[3].id)).toBe(2);
  });
});

describe('rule 5: action never orphans a single line', () => {
  it('pushes a two-line action that would leave one line behind', () => {
    // heading(1) blank(2) action 51 (=53) blank(54) two-line action: line1 at 55, line2 next page -> orphan; push both.
    const sp = fx([
      [['scene_heading', 'INT. ONE - DAY'], ['action', actionLines(51)], ['action', actionLines(2)]],
    ]);
    const r = paginate(sp);
    const shortAction = sp.scenes[0].elements[2];
    expect(r.pageOfElement.get(shortAction.id)).toBe(2);
    expect(r.splitElements.has(shortAction.id)).toBe(false);
  });

  it('splits a long action mid-element when both sides keep at least two lines', () => {
    // heading(1) blank(2) action 49 (=51) blank(52) long action lines 53,54,55 (3 stay), rest move.
    const sp = fx([
      [['scene_heading', 'INT. ONE - DAY'], ['action', actionLines(49)], ['action', actionLines(10)]],
    ]);
    const r = paginate(sp);
    const longAction = sp.scenes[0].elements[2];
    expect(r.splitElements.get(longAction.id)).toBe(3);
    expect(bodyLines(r.pages[1]).filter((l) => l.elementId === longAction.id).length).toBe(7);
  });
});

describe('bookkeeping', () => {
  it('pageOfElement and breakBeforeElement agree with page starts', () => {
    const sp = fx([[['scene_heading', 'INT. ONE - DAY'], ['action', actionLines(200)]]]);
    const r = paginate(sp);
    for (const id of r.breakBeforeElement) {
      const firstPage = r.pageOfElement.get(id)!;
      const page = r.pages[firstPage - 1];
      const firstText = page.lines.find((l) => l.kind === 'text');
      // element with a break-before owns the first text line of its page unless it was split
      if (!r.splitElements.has(id)) expect(firstText?.elementId).toBe(id);
    }
  });
});
