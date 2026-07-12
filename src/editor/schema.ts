import { Schema } from 'prosemirror-model';
import type { ElementType } from '../model/screenplay';

export const ELEMENT_TYPES: ElementType[] = [
  'scene_heading',
  'action',
  'character',
  'parenthetical',
  'dialogue',
  'transition',
];

/** One ProseMirror block node per screenplay element type.
    Every block carries the stable elementId and its owning sceneId. */
function blockSpec(type: ElementType) {
  return {
    content: 'text*',
    group: 'element',
    attrs: { elementId: { default: '' }, sceneId: { default: '' } },
    toDOM(node: { attrs: Record<string, unknown> }) {
      return [
        'div',
        {
          class: `sp-element sp-${type}`,
          'data-element-id': node.attrs.elementId as string,
          'data-scene-id': node.attrs.sceneId as string,
          'data-element-type': type,
        },
        0,
      ] as const;
    },
    parseDOM: [{ tag: `div[data-element-type="${type}"]` }],
  };
}

export const screenplaySchema = new Schema({
  nodes: {
    doc: { content: 'element+' },
    ...Object.fromEntries(ELEMENT_TYPES.map((t) => [t, blockSpec(t)])),
    text: {},
  },
});
