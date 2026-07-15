import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import type { Node as PMNode } from 'prosemirror-model';
import type { ReadMark } from '../workflow/types';

const TAG_TEXT: Record<ReadMark['type'], string> = {
  great: 'GREAT STUFF',
  cut: 'CUT?',
  dropped: 'DROPPED OUT',
  question: 'QUESTION',
};

/** Renders the writer's private-read marks on the paper: a per-element class
    (highlight / strikethrough / dotted underline) plus a rotated margin tag.
    Rendering-only, like the annotation markers: never reflows Courier content
    or pagination. Data lives in the store; the editor recreates state when
    readMarks change (see ScreenplayEditor's subscribe block). */
export function readMarksPlugin(getMarks: () => ReadMark[]): Plugin {
  const build = (doc: PMNode) => {
    const marks = getMarks();
    if (marks.length === 0) return DecorationSet.empty;
    const byElement = new Map<string, ReadMark[]>();
    for (const m of marks) byElement.set(m.elementId, [...(byElement.get(m.elementId) ?? []), m]);
    const decorations: Decoration[] = [];
    doc.forEach((node, offset) => {
      const elementId = node.attrs.elementId as string;
      const elementMarks = byElement.get(elementId);
      if (!elementMarks) return;
      for (const m of elementMarks) {
        decorations.push(Decoration.node(offset, offset + node.nodeSize, { class: `sp-mark-${m.type}` }));
        decorations.push(
          Decoration.widget(
            offset + node.nodeSize - 1,
            () => {
              const tag = document.createElement('span');
              tag.className = `sp-mark-tag sp-mark-tag-${m.type}`;
              tag.contentEditable = 'false';
              tag.textContent = TAG_TEXT[m.type];
              tag.setAttribute('aria-hidden', 'true');
              return tag;
            },
            // Repo gotcha: widget keys must encode everything they render.
            { key: `readmark:${m.id}`, side: 1, ignoreSelection: true },
          ),
        );
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
