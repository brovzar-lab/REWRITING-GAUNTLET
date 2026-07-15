import { describe, expect, it } from 'vitest';
import { whatWorkedItems } from './whatWorked';
import { emptyWorkflow } from './types';
import type { Screenplay } from '../model/screenplay';

const screenplay = {
  scenes: [{ id: 's1', elements: [{ id: 'e1', text: 'MARTA laughs through tears.' }] }],
} as unknown as Screenplay;

describe('whatWorkedItems', () => {
  it('collects reader whatWorked notes and writer great-stuff marks', () => {
    const wf = emptyWorkflow();
    wf.readers = [
      {
        id: 'r1',
        name: 'Rodrigo',
        role: 'initial',
        addedAt: 1,
        notes: [{ id: 'n1', quote: 'The kitchen scene sings', kind: 'whatWorked', createdAt: 1 }],
      },
    ];
    wf.readMarks = [{ id: 'm1', type: 'great', sceneId: 's1', elementId: 'e1', page: 3, createdAt: 2 }];
    const items = whatWorkedItems(wf, screenplay);
    expect(items).toHaveLength(2);
    expect(items[0].attribution).toBe('Rodrigo');
    expect(items[1].text).toContain('MARTA laughs');
    expect(items[1].attribution).toBe('You');
  });

  it('ignores cut/dropped/question marks and symptom notes', () => {
    const wf = emptyWorkflow();
    wf.readMarks = [{ id: 'm1', type: 'cut', sceneId: 's1', elementId: 'e1', page: 1, createdAt: 1 }];
    expect(whatWorkedItems(wf, screenplay)).toHaveLength(0);
  });
});
