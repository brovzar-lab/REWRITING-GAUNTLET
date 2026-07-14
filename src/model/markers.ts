import type { Screenplay } from './screenplay';

/** Epps's Set-Up: an element the writer plants so a later element can pay it
    off. Set-ups and pay-offs anchor to exact elements (not whole scenes), so
    the map can tell the truth by position. Reused margin channel later. */

/** Epps's Four Major High Points, plus the emotional highs and lows of the
    "roller coaster". The four structural roles are unique (one scene each);
    emotional markers may repeat across scenes. A scene holds at most one. */
export type HighPointRole =
  | 'act_one_end'
  | 'midpoint'
  | 'act_two_end'
  | 'climax'
  | 'emotional_high'
  | 'emotional_low';

export type StructuralRole = 'act_one_end' | 'midpoint' | 'act_two_end' | 'climax';

export const STRUCTURAL_ROLES: StructuralRole[] = ['act_one_end', 'midpoint', 'act_two_end', 'climax'];

export function isStructuralRole(role: HighPointRole): role is StructuralRole {
  return (STRUCTURAL_ROLES as string[]).includes(role);
}

export interface HighPointMarker {
  role: HighPointRole;
  sceneId: string;
}

/** The structural roles not yet placed, in book order. */
export function missingStructuralRoles(markers: HighPointMarker[]): StructuralRole[] {
  const placed = new Set(markers.map((m) => m.role));
  return STRUCTURAL_ROLES.filter((r) => !placed.has(r));
}

export interface MomentumPoint {
  sceneId: string;
  number: number;
  slug: string;
  direction: 'high' | 'low';
}

/** The emotional highs and lows, grouped by act, in scene order — the
    roller-coaster shape the writer can read at a glance. */
export function momentumByAct(
  markers: HighPointMarker[],
  sp: Screenplay,
): { act: 1 | 2 | 3; points: MomentumPoint[] }[] {
  const sceneById = new Map(sp.scenes.map((s) => [s.id, s]));
  const points: (MomentumPoint & { act: 1 | 2 | 3 })[] = [];
  for (const m of markers) {
    if (m.role !== 'emotional_high' && m.role !== 'emotional_low') continue;
    const scene = sceneById.get(m.sceneId);
    if (!scene) continue;
    points.push({
      sceneId: scene.id,
      number: scene.number,
      slug: scene.slug,
      direction: m.role === 'emotional_high' ? 'high' : 'low',
      act: scene.act,
    });
  }
  points.sort((a, b) => a.number - b.number);
  return ([1, 2, 3] as const)
    .map((act) => ({ act, points: points.filter((p) => p.act === act).map(({ act: _a, ...p }) => p) }))
    .filter((g) => g.points.length > 0);
}

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
