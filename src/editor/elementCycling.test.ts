import { describe, expect, it } from 'vitest';
import { nextElementOnEnter, nextElementOnTab } from './elementCycling';
import type { ElementType } from '../model/screenplay';

/** Final Draft default element transitions. */
const ENTER_TABLE: Record<ElementType, ElementType> = {
  scene_heading: 'action',
  action: 'action',
  character: 'dialogue',
  parenthetical: 'dialogue',
  dialogue: 'character',
  transition: 'scene_heading',
};

const TAB_TABLE: Record<ElementType, ElementType> = {
  scene_heading: 'action',
  action: 'character',
  character: 'transition',
  parenthetical: 'dialogue',
  dialogue: 'parenthetical',
  transition: 'scene_heading',
};

describe('Final Draft-style element transitions', () => {
  (Object.keys(ENTER_TABLE) as ElementType[]).forEach((from) => {
    it(`Enter after ${from} creates ${ENTER_TABLE[from]}`, () => {
      expect(nextElementOnEnter(from)).toBe(ENTER_TABLE[from]);
    });
  });

  (Object.keys(TAB_TABLE) as ElementType[]).forEach((from) => {
    it(`Tab in ${from} switches to ${TAB_TABLE[from]}`, () => {
      expect(nextElementOnTab(from)).toBe(TAB_TABLE[from]);
    });
  });
});
