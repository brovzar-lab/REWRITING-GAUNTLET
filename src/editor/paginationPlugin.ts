import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import type { Node as PMNode } from 'prosemirror-model';
import { paginate } from '../pagination/engine';
import { elementWidth, wrapText } from '../pagination/metrics';
import { parseDoc } from './docSync';
import type { ElementType, Screenplay } from '../model/screenplay';

interface ElementPos {
  pos: number;
  node: PMNode;
}

function boundaryWidget(pageNumber: number, more: boolean, contdText: string | null, revisionLabel: string | null) {
  return () => {
    const wrap = document.createElement('div');
    wrap.className = 'sp-page-boundary';
    wrap.setAttribute('contenteditable', 'false');
    if (more) {
      const m = document.createElement('div');
      m.className = 'sp-more';
      m.textContent = '(MORE)';
      wrap.appendChild(m);
    }
    const gap = document.createElement('div');
    gap.className = 'sp-page-gap';
    gap.setAttribute('aria-hidden', 'true');
    wrap.appendChild(gap);
    const header = document.createElement('div');
    header.className = 'sp-page-header';
    if (revisionLabel) {
      const rev = document.createElement('span');
      rev.className = 'sp-rev-label';
      rev.textContent = revisionLabel;
      header.appendChild(rev);
    }
    const num = document.createElement('span');
    num.className = 'sp-page-num';
    num.textContent = `${pageNumber}.`;
    header.appendChild(num);
    wrap.appendChild(header);
    if (contdText) {
      const c = document.createElement('div');
      c.className = 'sp-contd';
      c.textContent = contdText;
      wrap.appendChild(c);
    }
    return wrap;
  };
}

function buildDecorations(doc: PMNode, previous: Screenplay, revisionLabel: string | null): DecorationSet {
  const screenplay = parseDoc(doc, previous);
  const result = paginate(screenplay);

  const positions = new Map<string, ElementPos>();
  doc.forEach((node, offset) => {
    positions.set(node.attrs.elementId as string, { pos: offset, node });
  });

  const decorations: Decoration[] = [];

  // Scene numbers in the heading margin.
  for (const scene of screenplay.scenes) {
    const heading = scene.elements[0];
    if (heading?.type !== 'scene_heading') continue;
    const info = positions.get(heading.id);
    if (!info) continue;
    decorations.push(
      Decoration.node(info.pos, info.pos + info.node.nodeSize, {
        'data-scene-number': String(scene.number),
      }),
    );
  }

  // Page boundaries (end of page N / header of page N+1), with (MORE)/(CONT'D).
  for (let i = 1; i < result.pages.length; i++) {
    const page = result.pages[i];
    const firstText = page.lines.find((l) => l.kind === 'text');
    if (!firstText) continue;
    const info = positions.get(firstText.elementId);
    if (!info) continue;

    const prevPage = result.pages[i - 1];
    const more = prevPage.lines[prevPage.lines.length - 1]?.kind === 'more';
    const contd = page.lines.find((l) => l.kind === 'contd');

    let widgetPos = info.pos;
    if (firstText.lineIndex > 0) {
      const text = info.node.textContent;
      const type = info.node.type.name as ElementType;
      const lines = wrapText(text, elementWidth(type));
      let offset = lines.slice(0, firstText.lineIndex).join(' ').length;
      if (text[offset] === ' ') offset += 1;
      widgetPos = info.pos + 1 + Math.min(offset, text.length);
    }

    decorations.push(
      Decoration.widget(widgetPos, boundaryWidget(page.number, more, contd?.text ?? null, revisionLabel), {
        side: -1,
        // the key must change with everything the widget renders, or the view reuses stale DOM
        key: `page-${page.number}-${more ? 'm' : ''}-${contd?.text ?? ''}-${revisionLabel ?? ''}`,
      }),
    );
  }

  return DecorationSet.create(doc, decorations);
}

/** Renders the pagination engine's output as editor decorations. The engine
    (not this plugin, not the DOM) owns every break decision. */
export function paginationPlugin(
  getScreenplay: () => Screenplay,
  getRevisionLabel: () => string | null = () => null,
): Plugin {
  return new Plugin({
    state: {
      init: (_config, state) => buildDecorations(state.doc, getScreenplay(), getRevisionLabel()),
      apply: (tr, old) => (tr.docChanged ? buildDecorations(tr.doc, getScreenplay(), getRevisionLabel()) : old),
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
}
