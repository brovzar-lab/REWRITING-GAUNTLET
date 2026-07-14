import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from './appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

const beatFor = (elementId: string) =>
  useAppStore.getState().storyBeats.find((b) => b.elementId === elementId);

describe('story beats: direct line marking', () => {
  it('marks a line as a set-up, then a different line as a pay-off', () => {
    const s = useAppStore.getState();
    s.setStoryBeat('setup', 'sc1', 'sc1-e2');
    s.setStoryBeat('payoff', 'sc3', 'sc3-e1');
    expect(beatFor('sc1-e2')).toMatchObject({ kind: 'setup', sceneId: 'sc1', pairedWith: null });
    expect(beatFor('sc3-e1')).toMatchObject({ kind: 'payoff' });
  });

  it('toggles the same kind off, and switches kind in place', () => {
    const s = useAppStore.getState();
    s.setStoryBeat('setup', 'sc1', 'sc1-e2');
    s.setStoryBeat('setup', 'sc1', 'sc1-e2'); // same kind → remove
    expect(beatFor('sc1-e2')).toBeUndefined();

    s.setStoryBeat('setup', 'sc1', 'sc1-e2');
    s.setStoryBeat('payoff', 'sc1', 'sc1-e2'); // other kind → switch
    expect(beatFor('sc1-e2')).toMatchObject({ kind: 'payoff' });
  });

  it('pairs a set-up with a pay-off both ways and unpairs cleanly', () => {
    const s = useAppStore.getState();
    s.setStoryBeat('setup', 'sc1', 'sc1-e2');
    s.setStoryBeat('payoff', 'sc3', 'sc3-e1');
    const setup = beatFor('sc1-e2')!;
    const payoff = beatFor('sc3-e1')!;
    s.pairBeats(setup.id, payoff.id);
    expect(beatFor('sc1-e2')!.pairedWith).toBe(payoff.id);
    expect(beatFor('sc3-e1')!.pairedWith).toBe(setup.id);

    s.unpairBeat(setup.id);
    expect(beatFor('sc1-e2')!.pairedWith).toBeNull();
    expect(beatFor('sc3-e1')!.pairedWith).toBeNull();
  });

  it('re-pairing a set-up drops its previous pay-off partner', () => {
    const s = useAppStore.getState();
    s.setStoryBeat('setup', 'sc1', 'sc1-e2');
    s.setStoryBeat('payoff', 'sc2', 'sc2-e1');
    s.setStoryBeat('payoff', 'sc3', 'sc3-e1');
    const setup = beatFor('sc1-e2')!;
    s.pairBeats(setup.id, beatFor('sc2-e1')!.id);
    s.pairBeats(setup.id, beatFor('sc3-e1')!.id);
    expect(beatFor('sc2-e1')!.pairedWith).toBeNull();
    expect(beatFor('sc3-e1')!.pairedWith).toBe(setup.id);
  });

  it('removing a beat clears its partner pairing', () => {
    const s = useAppStore.getState();
    s.setStoryBeat('setup', 'sc1', 'sc1-e2');
    s.setStoryBeat('payoff', 'sc3', 'sc3-e1');
    const setup = beatFor('sc1-e2')!;
    const payoff = beatFor('sc3-e1')!;
    s.pairBeats(setup.id, payoff.id);
    s.setStoryBeat('setup', 'sc1', 'sc1-e2'); // toggle the set-up off
    expect(beatFor('sc3-e1')!.pairedWith).toBeNull();
  });

  it('importing a new document clears beats — they belong to the old draft', () => {
    const s = useAppStore.getState();
    s.setStoryBeat('setup', 'sc1', 'sc1-e2');
    s.replaceDocument({ id: 'new', title: 'N', draftLabel: 'First', scenes: s.screenplay.scenes });
    expect(useAppStore.getState().storyBeats).toEqual([]);
  });
});
