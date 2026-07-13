import { describe, expect, it } from 'vitest';
import { emptyGamePlan, movePassPriority } from './gameplan';
import { EPPS_PASSES } from './passes';

describe('emptyGamePlan', () => {
  it('starts every writer field empty — the plan is writer-authored, never pre-filled', () => {
    const gp = emptyGamePlan();
    expect(gp.statementOfIntent).toBe('');
    expect(gp.about).toBe('');
    expect(gp.improves).toBe('');
    expect(gp.mustNotBeLost).toBe('');
    expect(gp.audiencePromise).toBe('');
    expect(gp.emotionalSpine).toBe('');
    expect(gp.compass.touchstone).toBe('');
    expect(gp.compass.tickingClock).toBe('');
    expect(gp.compass.tickingClockAnchor).toBeNull();
    expect(gp.compass.themeThroughAction).toBe('');
    expect(gp.compass.motifs).toEqual([]);
  });

  it('pass priorities default to the book order of all eleven passes', () => {
    expect(emptyGamePlan().passPriorities).toEqual(EPPS_PASSES.map((p) => p.id));
  });
});

describe('movePassPriority', () => {
  const base = ['foundation', 'character', 'structure'];

  it('moves the dragged pass to the drop target position', () => {
    expect(movePassPriority(base, 'structure', 'foundation')).toEqual([
      'structure',
      'foundation',
      'character',
    ]);
    expect(movePassPriority(base, 'foundation', 'structure')).toEqual([
      'character',
      'structure',
      'foundation',
    ]);
  });

  it('is a no-op for unknown ids or self-drops, and never mutates its input', () => {
    expect(movePassPriority(base, 'structure', 'structure')).toEqual(base);
    expect(movePassPriority(base, 'nope', 'character')).toEqual(base);
    expect(movePassPriority(base, 'character', 'nope')).toEqual(base);
    movePassPriority(base, 'structure', 'foundation');
    expect(base).toEqual(['foundation', 'character', 'structure']);
  });
});
