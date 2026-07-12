import { describe, expect, it } from 'vitest';
import { EPPS_PASSES } from './passes';
import { sampleEvidence, sampleConnections, sampleScreenplay } from './sample/gauntlet-sample';

describe('Epps rewrite passes', () => {
  it('exports exactly 11 passes in the order Epps gives in the book', () => {
    expect(EPPS_PASSES.map((p) => p.name)).toEqual([
      'Foundation',
      'Character',
      'Story and Theme',
      'Structure',
      'Plot',
      'Complications, Obstacles, Reveals and Reversals',
      'Relationship',
      'Scene',
      'Dialogue',
      'Consistency',
      'Polish',
    ]);
  });

  it('numbers passes sequentially from 1', () => {
    EPPS_PASSES.forEach((p, i) => expect(p.order).toBe(i + 1));
  });
});

describe('sample screenplay', () => {
  it('has at least 10 scenes spread across all 3 acts', () => {
    expect(sampleScreenplay.scenes.length).toBeGreaterThanOrEqual(10);
    for (const act of [1, 2, 3] as const) {
      expect(sampleScreenplay.scenes.some((s) => s.act === act)).toBe(true);
    }
  });

  it('numbers scenes sequentially and gives each a slug and story function', () => {
    sampleScreenplay.scenes.forEach((s, i) => {
      expect(s.number).toBe(i + 1);
      expect(s.slug.length).toBeGreaterThan(0);
      expect(['plot', 'setup', 'opposition', 'resolution', 'relationship']).toContain(s.storyFunction);
    });
  });

  it('every scene opens with a scene heading and has dialogue or action', () => {
    for (const s of sampleScreenplay.scenes) {
      expect(s.elements[0].type).toBe('scene_heading');
      expect(s.elements.length).toBeGreaterThan(1);
    }
  });

  it('has globally unique element ids', () => {
    const ids = sampleScreenplay.scenes.flatMap((s) => s.elements.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('sample evidence', () => {
  it('every record points at an existing scene and element', () => {
    for (const ev of sampleEvidence) {
      const scene = sampleScreenplay.scenes.find((s) => s.id === ev.sceneId);
      expect(scene, `scene ${ev.sceneId} for evidence ${ev.id}`).toBeDefined();
      expect(
        scene!.elements.some((el) => el.id === ev.elementId),
        `element ${ev.elementId} for evidence ${ev.id}`,
      ).toBe(true);
    }
  });

  it('covers all five note sources and all five claim types', () => {
    const sources = new Set(sampleEvidence.map((e) => e.source));
    const claims = new Set(sampleEvidence.map((e) => e.claimType));
    expect(sources).toEqual(new Set(['writer', 'reader', 'ai', 'producer_executive', 'interim_reader']));
    expect(claims).toEqual(
      new Set(['textual_fact', 'reader_reaction', 'ai_hypothesis', 'writer_confirmed', 'unresolved_hypothesis']),
    );
  });

  it('uses only the three evidence statuses', () => {
    for (const ev of sampleEvidence) {
      expect(['clear', 'uncertain', 'priority_concern']).toContain(ev.status);
    }
  });
});

describe('sample connections', () => {
  it('every connection joins two existing scenes and has a kind and label', () => {
    const sceneIds = new Set(sampleScreenplay.scenes.map((s) => s.id));
    for (const c of sampleConnections) {
      expect(sceneIds.has(c.fromSceneId)).toBe(true);
      expect(sceneIds.has(c.toSceneId)).toBe(true);
      expect(['setup_payoff', 'escalation', 'relationship']).toContain(c.kind);
      expect(c.label.length).toBeGreaterThan(0);
    }
  });
});
