import type { ElementType } from '../model/screenplay';

/** Final Draft default transitions: the element created by Enter. */
const ENTER_NEXT: Record<ElementType, ElementType> = {
  scene_heading: 'action',
  action: 'action',
  character: 'dialogue',
  parenthetical: 'dialogue',
  dialogue: 'character',
  transition: 'scene_heading',
};

/** Final Draft default transitions: what Tab retypes the current element to. */
const TAB_NEXT: Record<ElementType, ElementType> = {
  scene_heading: 'action',
  action: 'character',
  character: 'transition',
  parenthetical: 'dialogue',
  dialogue: 'parenthetical',
  transition: 'scene_heading',
};

export function nextElementOnEnter(current: ElementType): ElementType {
  return ENTER_NEXT[current];
}

export function nextElementOnTab(current: ElementType): ElementType {
  return TAB_NEXT[current];
}
