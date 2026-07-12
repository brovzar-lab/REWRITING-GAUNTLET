import { keymap } from 'prosemirror-keymap';
import { TextSelection, type EditorState, type Plugin, type Transaction } from 'prosemirror-state';
import type { Node as PMNode } from 'prosemirror-model';
import { screenplaySchema } from './schema';
import { useAppStore } from '../store/appStore';
import type { ElementType } from '../model/screenplay';

/** Mod-1 … Mod-6 retype the current element to this order's entries. */
export const ELEMENT_KEY_ORDER: ElementType[] = [
  'scene_heading',
  'action',
  'character',
  'parenthetical',
  'dialogue',
  'transition',
];

export function currentBlock(state: EditorState): { node: PMNode; pos: number } | null {
  const { $from } = state.selection;
  if ($from.depth < 1) return null;
  return { node: $from.node(1), pos: $from.before(1) };
}

/** Zoom is rendering-only: these commands touch the store, never the doc. */
export function zoomKeymap(): Plugin {
  const step = 0.1;
  return keymap({
    'Mod-=': () => {
      const s = useAppStore.getState();
      s.setZoom(Math.round((s.zoom + step) * 10) / 10);
      return true;
    },
    'Mod--': () => {
      const s = useAppStore.getState();
      s.setZoom(Math.round((s.zoom - step) * 10) / 10);
      return true;
    },
    'Mod-0': () => {
      useAppStore.getState().setZoom(1);
      return true;
    },
  });
}

/** Direct element set (Mod-1..6), scene jump (Mod-Arrows), go-to-page (Mod-g). */
export function professionalKeymap(): Plugin {
  const bindings: Record<string, (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean> = {};

  ELEMENT_KEY_ORDER.forEach((type, i) => {
    bindings[`Mod-${i + 1}`] = (state, dispatch) => {
      const block = currentBlock(state);
      if (!block) return false;
      if (dispatch) dispatch(state.tr.setNodeMarkup(block.pos, screenplaySchema.nodes[type], block.node.attrs));
      return true;
    };
  });

  const jump = (direction: 1 | -1) => (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const block = currentBlock(state);
    if (!block) return false;
    const headings: number[] = [];
    state.doc.forEach((node, offset) => {
      if (node.type.name === 'scene_heading') headings.push(offset);
    });
    const target =
      direction === 1
        ? headings.find((pos) => pos > block.pos)
        : [...headings].reverse().find((pos) => pos < block.pos);
    if (target === undefined) return true;
    if (dispatch) {
      const tr = state.tr.setSelection(TextSelection.create(state.doc, target + 1));
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
  bindings['Mod-ArrowDown'] = jump(1);
  bindings['Mod-ArrowUp'] = jump(-1);

  bindings['Mod-g'] = () => {
    useAppStore.getState().setGoToPageOpen(true);
    return true;
  };

  return keymap(bindings);
}
