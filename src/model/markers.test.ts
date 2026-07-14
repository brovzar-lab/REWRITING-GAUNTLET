import { describe, expect, it } from 'vitest';
import type { Screenplay } from './screenplay';
import {
  elementOrder,
  isStructuralRole,
  missingStructuralRoles,
  momentumByAct,
  setupPayoffRows,
  type HighPointMarker,
  type StoryBeat,
} from './markers';

/** Four scenes, one element each for clarity of ordering. */
function sp(): Screenplay {
  const scene = (n: number) => ({
    id: `s${n}`,
    number: n,
    act: (n <= 1 ? 1 : n >= 4 ? 3 : 2) as 1 | 2 | 3,
    slug: `SCENE ${n}`,
    storyFunction: 'plot' as const,
    elements: [{ id: `s${n}-e1`, type: 'action' as const, text: `Action ${n}.` }],
  });
  return { id: 'sp', title: 'T', draftLabel: 'D', scenes: [scene(1), scene(2), scene(3), scene(4)] };
}

const beat = (id: string, kind: 'setup' | 'payoff', elementId: string, pairedWith: string | null = null): StoryBeat => ({
  id,
  kind,
  sceneId: elementId.split('-')[0],
  elementId,
  pairedWith,
});

describe('elementOrder', () => {
  it('assigns a strictly increasing index in reading order', () => {
    const order = elementOrder(sp());
    expect(order.get('s1-e1')).toBe(0);
    expect(order.get('s4-e1')).toBe(3);
    expect(order.get('s2-e1')! < order.get('s3-e1')!).toBe(true);
  });
});

describe('setupPayoffRows', () => {
  it('a set-up before its pay-off is OK', () => {
    const beats = [beat('b1', 'setup', 's1-e1', 'b2'), beat('b2', 'payoff', 's3-e1', 'b1')];
    const rows = setupPayoffRows(beats, sp());
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('ok');
    expect(rows[0].setup?.id).toBe('b1');
    expect(rows[0].payoff?.id).toBe('b2');
  });

  it('a pay-off before its set-up is a late set-up', () => {
    const beats = [beat('b1', 'setup', 's3-e1', 'b2'), beat('b2', 'payoff', 's1-e1', 'b1')];
    const rows = setupPayoffRows(beats, sp());
    expect(rows[0].status).toBe('late_setup');
  });

  it('a set-up with no pay-off is unpaid', () => {
    const rows = setupPayoffRows([beat('b1', 'setup', 's1-e1')], sp());
    expect(rows[0].status).toBe('unpaid_setup');
    expect(rows[0].payoff).toBeNull();
  });

  it('a pay-off with no set-up is an orphan', () => {
    const rows = setupPayoffRows([beat('b1', 'payoff', 's2-e1')], sp());
    expect(rows[0].status).toBe('orphan_payoff');
    expect(rows[0].setup).toBeNull();
  });

  it('produces one row per pair and sorts rows by earliest element position', () => {
    const beats = [
      beat('p2', 'payoff', 's4-e1'), // orphan, latest
      beat('s1', 'setup', 's1-e1', 'p1'),
      beat('p1', 'payoff', 's3-e1', 's1'),
      beat('s2', 'setup', 's2-e1'), // unpaid, middle
    ];
    const rows = setupPayoffRows(beats, sp());
    expect(rows.map((r) => r.status)).toEqual(['ok', 'unpaid_setup', 'orphan_payoff']);
  });

  it('does not mutate its inputs', () => {
    const beats = [beat('b1', 'setup', 's1-e1', 'b2'), beat('b2', 'payoff', 's3-e1', 'b1')];
    const snapshot = JSON.stringify(beats);
    setupPayoffRows(beats, sp());
    expect(JSON.stringify(beats)).toBe(snapshot);
  });
});

describe('high points', () => {
  it('knows which roles are structural', () => {
    expect(isStructuralRole('midpoint')).toBe(true);
    expect(isStructuralRole('emotional_high')).toBe(false);
  });

  it('reports missing structural roles in book order', () => {
    const markers: HighPointMarker[] = [
      { role: 'midpoint', sceneId: 's2' },
      { role: 'climax', sceneId: 's4' },
    ];
    expect(missingStructuralRoles(markers)).toEqual(['act_one_end', 'act_two_end']);
  });

  it('builds the momentum roller-coaster per act, in scene order, emotional only', () => {
    const markers: HighPointMarker[] = [
      { role: 'emotional_low', sceneId: 's3' },
      { role: 'emotional_high', sceneId: 's1' },
      { role: 'midpoint', sceneId: 's2' }, // structural — excluded from momentum
    ];
    const byAct = momentumByAct(markers, sp());
    // s1 in act 1, s3 in act 2
    expect(byAct).toEqual([
      { act: 1, points: [{ sceneId: 's1', number: 1, slug: 'SCENE 1', direction: 'high' }] },
      { act: 2, points: [{ sceneId: 's3', number: 3, slug: 'SCENE 3', direction: 'low' }] },
    ]);
  });
});
