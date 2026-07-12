import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import type { Node as PMNode } from 'prosemirror-model';
import { useAppStore } from '../store/appStore';
import { translate } from '../i18n/strings';

/** Margin note markers: every element with at least one evidence record or
    open finding citation gets a count badge in the right page margin, plus a
    'has-evidence' class so the selected line can draw its connector stub.
    Clicking a marker selects the line and opens the evidence tab.
    Rendering-only, like zoom: never reflows Courier content or pagination. */
export function annotationPlugin(getCounts: () => Map<string, number>): Plugin {
  const build = (doc: PMNode) => {
    const counts = getCounts();
    if (counts.size === 0) return DecorationSet.empty;
    const decorations: Decoration[] = [];
    doc.forEach((node, offset) => {
      const elementId = node.attrs.elementId as string;
      const sceneId = node.attrs.sceneId as string;
      const count = counts.get(elementId) ?? 0;
      if (count === 0) return;
      decorations.push(Decoration.node(offset, offset + node.nodeSize, { class: 'has-evidence' }));
      decorations.push(
        Decoration.widget(
          offset + node.nodeSize - 1,
          () => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'sp-note-marker';
            button.contentEditable = 'false';
            const lang = useAppStore.getState().lang;
            button.setAttribute('aria-label', translate(lang, 'marker.notes').replace('{n}', String(count)));
            button.textContent = String(count);
            // Keep the caret where it is; the click is a navigation action.
            button.addEventListener('mousedown', (e) => e.preventDefault());
            button.addEventListener('click', (e) => {
              e.preventDefault();
              const s = useAppStore.getState();
              s.select({ sceneId, elementId });
              s.setInspectorTab('evidence');
            });
            return button;
          },
          // Repo gotcha: widget keys must encode everything they render.
          { key: `${elementId}:${count}`, side: 1, ignoreSelection: true },
        ),
      );
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
