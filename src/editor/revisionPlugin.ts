import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import type { Node as PMNode } from 'prosemirror-model';

/** Marks every element changed since the revision baseline with the
    'sp-revised' class (rendered as a margin asterisk — position, not color,
    carries the meaning). */
export function revisionPlugin(getBaseline: () => Record<string, string> | null): Plugin {
  const build = (doc: PMNode) => {
    const baseline = getBaseline();
    if (!baseline) return DecorationSet.empty;
    const decorations: Decoration[] = [];
    doc.forEach((node, offset) => {
      const id = node.attrs.elementId as string;
      if (!(id in baseline) || baseline[id] !== node.textContent) {
        decorations.push(Decoration.node(offset, offset + node.nodeSize, { class: 'sp-revised' }));
      }
    });
    return DecorationSet.create(doc, decorations);
  };
  return new Plugin({
    state: {
      init: (_config, state) => build(state.doc),
      apply: (tr, old) => (tr.docChanged ? build(tr.doc) : old),
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
}
