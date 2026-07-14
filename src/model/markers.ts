import type { Screenplay } from './screenplay';

/** Epps's Set-Up: an element the writer plants so a later element can pay it
    off. Set-ups and pay-offs anchor to exact elements (not whole scenes), so
    the map can tell the truth by position. Reused margin channel later. */

export type StoryBeatKind = 'setup' | 'payoff';

export interface StoryBeat {
  id: string;
  kind: StoryBeatKind;
  sceneId: string;
  elementId: string;
  /** id of the paired beat of the opposite kind, or null when unpaired. */
  pairedWith: string | null;
}

export type SetupPayoffStatus = 'ok' | 'late_setup' | 'unpaid_setup' | 'orphan_payoff';

export interface SetupPayoffRow {
  status: SetupPayoffStatus;
  setup: StoryBeat | null;
  payoff: StoryBeat | null;
}

/** Reading-order index for every element, so position comparisons are exact. */
export function elementOrder(sp: Screenplay): Map<string, number> {
  const order = new Map<string, number>();
  let i = 0;
  for (const scene of sp.scenes) for (const el of scene.elements) order.set(el.id, i++);
  return order;
}

/** One row per set-up (paired or not) plus one per orphan pay-off, each with a
    status derived purely from element position. Never mutates its inputs. */
export function setupPayoffRows(beats: StoryBeat[], sp: Screenplay): SetupPayoffRow[] {
  const order = elementOrder(sp);
  const byId = new Map(beats.map((b) => [b.id, b]));
  const pos = (b: StoryBeat) => order.get(b.elementId) ?? Number.POSITIVE_INFINITY;
  const rows: SetupPayoffRow[] = [];

  for (const setup of beats.filter((b) => b.kind === 'setup')) {
    const payoff = setup.pairedWith ? byId.get(setup.pairedWith) : undefined;
    if (!payoff || payoff.kind !== 'payoff') {
      rows.push({ status: 'unpaid_setup', setup, payoff: null });
      continue;
    }
    rows.push({ status: pos(setup) <= pos(payoff) ? 'ok' : 'late_setup', setup, payoff });
  }
  for (const payoff of beats.filter((b) => b.kind === 'payoff')) {
    const setup = payoff.pairedWith ? byId.get(payoff.pairedWith) : undefined;
    if (!setup || setup.kind !== 'setup') {
      rows.push({ status: 'orphan_payoff', setup: null, payoff });
    }
  }

  const rowPos = (r: SetupPayoffRow) =>
    Math.min(...[r.setup, r.payoff].filter((b): b is StoryBeat => !!b).map(pos));
  return rows.sort((a, b) => rowPos(a) - rowPos(b));
}
