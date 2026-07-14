import { useEffect, useRef, useState } from 'react';
import { EditorState, Plugin, TextSelection, type Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap, chainCommands, newlineInCode } from 'prosemirror-commands';
import { history, redo, undo } from 'prosemirror-history';
import { screenplaySchema } from './schema';
import { buildDoc, parseDoc } from './docSync';
import { nextElementOnEnter, nextElementOnTab } from './elementCycling';
import { paginationPlugin } from './paginationPlugin';
import { revisionPlugin } from './revisionPlugin';
import { annotationPlugin } from './annotationPlugin';
import { currentBlock, professionalKeymap, zoomKeymap } from './editorKeymap';
import { registerEditorView } from './editorHandle';
import { suggestCharacters } from './smartType';
import type { ElementType } from '../model/screenplay';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';
import './editor.css';

/** Enter: split and retype the new block per the Final Draft table, with a fresh stable id. */
function enterCommand(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const block = currentBlock(state);
  if (!block) return false;
  const from = block.node.type.name as ElementType;
  const next = nextElementOnEnter(from);
  if (!dispatch) return true;
  let tr = state.tr.deleteSelection();
  tr = tr.split(tr.selection.from, 1, [
    {
      type: screenplaySchema.nodes[next],
      attrs: { elementId: `el-${crypto.randomUUID()}`, sceneId: block.node.attrs.sceneId as string },
    },
  ]);
  dispatch(tr.scrollIntoView());
  return true;
}

/** Tab: retype the current block per the Final Draft table, keeping its identity. */
function tabCommand(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const block = currentBlock(state);
  if (!block) return false;
  const from = block.node.type.name as ElementType;
  const next = nextElementOnTab(from);
  if (!dispatch) return true;
  const tr = state.tr.setNodeMarkup(block.pos, screenplaySchema.nodes[next], block.node.attrs);
  dispatch(tr);
  return true;
}

/** Evidence records, open finding citations, motif occurrences, and the linked
    ticking clock, counted per element, feed the margin note markers. */
export function annotationCounts(s: ReturnType<typeof useAppStore.getState>): Map<string, number> {
  const counts = new Map<string, number>();
  const bump = (elementId: string) => counts.set(elementId, (counts.get(elementId) ?? 0) + 1);
  for (const e of s.evidence) bump(e.elementId);
  for (const f of s.workflow.findings) {
    if (f.resolution !== 'open') continue;
    for (const c of f.citations) bump(c.elementId);
  }
  for (const motif of s.gamePlan.compass.motifs) {
    for (const o of motif.occurrences) bump(o.elementId);
  }
  if (s.gamePlan.compass.tickingClockAnchor) bump(s.gamePlan.compass.tickingClockAnchor.elementId);
  return counts;
}

/** Marks the block that carries the caret so the working line stays visible. */
const selectedLinePlugin = new Plugin({
  props: {
    decorations(state) {
      const block = currentBlock(state);
      if (!block) return null;
      return DecorationSet.create(state.doc, [
        Decoration.node(block.pos, block.pos + block.node.nodeSize, { class: 'sp-selected' }),
      ]);
    },
  },
});

interface SmartTypeState {
  items: string[];
  index: number;
  left: number;
  top: number;
  /** Open upward when the cue sits near the bottom of the visible page area. */
  flip: boolean;
}

export interface ScreenplayEditorProps {
  onReady?: (view: EditorView) => void;
}

export function ScreenplayEditor({ onReady }: ScreenplayEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const syncingFromEditor = useRef(false);
  const zoom = useAppStore((s) => s.zoom);
  const readOnly = useAppStore((s) => s.readOnly);
  const t = useT();

  // Re-evaluate ProseMirror's editable() when read-only toggles.
  useEffect(() => {
    viewRef.current?.setProps({ editable: () => !readOnly });
  }, [readOnly]);

  const [smartType, setSmartType] = useState<SmartTypeState | null>(null);
  const smartTypeRef = useRef<SmartTypeState | null>(null);
  const updateSmartType = (next: SmartTypeState | null) => {
    smartTypeRef.current = next;
    setSmartType(next);
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const store = useAppStore;

    /** Accept a smart-type suggestion into the current character cue. */
    const acceptSuggestion = (view: EditorView, name: string, thenEnter: boolean) => {
      const block = currentBlock(view.state);
      if (!block) return;
      const from = block.pos + 1;
      const to = from + block.node.content.size;
      view.dispatch(view.state.tr.insertText(name, from, to));
      updateSmartType(null);
      if (thenEnter) enterCommand(view.state, view.dispatch);
      view.focus();
    };

    /** Runs before every other keymap while the suggestion popup is open. */
    const smartTypeKeys = new Plugin({
      props: {
        handleKeyDown(view, event) {
          const st = smartTypeRef.current;
          if (!st) return false;
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            const delta = event.key === 'ArrowDown' ? 1 : -1;
            updateSmartType({ ...st, index: (st.index + delta + st.items.length) % st.items.length });
            return true;
          }
          if (event.key === 'Enter' || event.key === 'Tab') {
            acceptSuggestion(view, st.items[st.index], event.key === 'Enter');
            return true;
          }
          if (event.key === 'Escape') {
            updateSmartType(null);
            return true;
          }
          return false;
        },
      },
    });

    const state = EditorState.create({
      doc: buildDoc(store.getState().screenplay),
      plugins: [
        smartTypeKeys,
        history(),
        keymap({
          Enter: chainCommands(newlineInCode, enterCommand),
          Tab: tabCommand,
          // Tab is reserved for element switching, so Escape is the keyboard
          // exit from the page: it moves focus to the next workspace region.
          Escape: () => {
            document.querySelector<HTMLElement>('[data-editor-exit]')?.focus();
            return true;
          },
          'Mod-z': undo,
          'Mod-y': redo,
          'Shift-Mod-z': redo,
        }),
        professionalKeymap(),
        keymap(baseKeymap),
        zoomKeymap(),
        paginationPlugin(
          () => store.getState().screenplay,
          () => {
            const label = store.getState().revisionSetLabel;
            return label ? `REV. ${label.toUpperCase()}` : null;
          },
        ),
        revisionPlugin(() => store.getState().revisionBaseline),
        annotationPlugin(() => annotationCounts(store.getState())),
        selectedLinePlugin,
      ],
    });

    const refreshSmartType = (view: EditorView, docChanged: boolean) => {
      const block = currentBlock(view.state);
      if (!block || block.node.type.name !== 'character') {
        if (smartTypeRef.current) updateSmartType(null);
        return;
      }
      if (!docChanged && !smartTypeRef.current) return; // open only while typing
      const text = block.node.textContent;
      const items = text.trim().length > 0 ? suggestCharacters(store.getState().screenplay, text).slice(0, 6) : [];
      if (items.length === 0) {
        if (smartTypeRef.current) updateSmartType(null);
        return;
      }
      let left = 0;
      let top = 0;
      let flip = false;
      try {
        const coords = view.coordsAtPos(block.pos + 1 + block.node.content.size);
        const scrollerEl = scrollerRef.current;
        const scroller = scrollerEl?.getBoundingClientRect();
        if (scrollerEl && scroller) {
          left = coords.left - scroller.left + scrollerEl.scrollLeft;
          top = coords.bottom - scroller.top + scrollerEl.scrollTop + 4;
          // Six items plus padding is ~170px; flip before the scroller edge cuts it.
          flip = coords.bottom + 170 > scroller.bottom;
        }
      } catch {
        /* jsdom has no layout; keep 0,0 */
      }
      updateSmartType({ items, index: 0, left, top, flip });
    };

    const view = new EditorView(host, {
      state,
      editable: () => !store.getState().readOnly,
      dispatchTransaction(tr) {
        const newState = view.state.apply(tr);
        view.updateState(newState);
        if (tr.docChanged) {
          syncingFromEditor.current = true;
          store.getState().loadScreenplay(parseDoc(newState.doc, store.getState().screenplay));
          syncingFromEditor.current = false;
        }
        if (tr.selectionSet || tr.docChanged) {
          const block = currentBlock(newState);
          if (block) {
            const selection = store.getState().selection;
            const sceneId = block.node.attrs.sceneId as string;
            const elementId = block.node.attrs.elementId as string;
            if (selection?.sceneId !== sceneId || selection?.elementId !== elementId) {
              syncingFromEditor.current = true;
              store.getState().select({ sceneId, elementId });
              syncingFromEditor.current = false;
            }
          }
          refreshSmartType(view, tr.docChanged);
        }
      },
    });
    viewRef.current = view;
    registerEditorView(view);
    onReady?.(view);

    // Outside changes (navigator, board, hydration, revision set) rebuild the
    // doc/decorations and move the cursor.
    let prevScreenplay = store.getState().screenplay;
    let prevSelection = store.getState().selection;
    let prevBaseline = store.getState().revisionBaseline;
    let prevEvidence = store.getState().evidence;
    let prevFindings = store.getState().workflow.findings;
    const unsubscribe = store.subscribe((s) => {
      const outsideDocChange = s.screenplay !== prevScreenplay && !syncingFromEditor.current;
      const revisionChange = s.revisionBaseline !== prevBaseline;
      const annotationChange = s.evidence !== prevEvidence || s.workflow.findings !== prevFindings;
      if (outsideDocChange || revisionChange || annotationChange) {
        const doc = outsideDocChange ? buildDoc(s.screenplay) : view.state.doc;
        view.updateState(
          EditorState.create({ doc, plugins: view.state.plugins }),
        );
      }
      prevScreenplay = s.screenplay;
      prevBaseline = s.revisionBaseline;
      prevEvidence = s.evidence;
      prevFindings = s.workflow.findings;

      if (s.selection !== prevSelection && s.selection && !syncingFromEditor.current) {
        let targetPos: number | null = null;
        view.state.doc.forEach((node, offset) => {
          if (node.attrs.elementId === s.selection!.elementId) targetPos = offset + 1;
        });
        if (targetPos !== null) {
          const tr = view.state.tr.setSelection(TextSelection.create(view.state.doc, targetPos));
          view.dispatch(tr);
          const dom = view.dom.querySelector(`[data-element-id="${s.selection.elementId}"]`);
          dom?.scrollIntoView?.({ block: 'center' });
        }
      }
      prevSelection = s.selection;
    });

    return () => {
      unsubscribe();
      view.destroy();
      viewRef.current = null;
      registerEditorView(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="sp-page-scroller"
      data-testid="screenplay-editor"
      role="region"
      aria-label="Screenplay"
      tabIndex={0}
      ref={scrollerRef}
      style={{ ['--sp-zoom' as string]: zoom, position: 'relative' }}
    >
      <div className="sp-page" ref={hostRef} aria-label="Screenplay page" />
      {smartType && (
        <ul
          className={`smart-type-popup${smartType.flip ? ' is-flipped' : ''}`}
          role="listbox"
          aria-label={t('smart.suggestions')}
          style={{ left: smartType.left, top: smartType.top }}
        >
          {smartType.items.map((name, i) => (
            <li
              key={name}
              id={`smart-type-option-${i}`}
              role="option"
              aria-selected={i === smartType.index}
              className={i === smartType.index ? 'is-active' : ''}
              onMouseDown={(e) => {
                e.preventDefault();
                const view = viewRef.current;
                if (!view) return;
                const block = currentBlock(view.state);
                if (!block) return;
                const from = block.pos + 1;
                const to = from + block.node.content.size;
                view.dispatch(view.state.tr.insertText(name, from, to));
                updateSmartType(null);
                view.focus();
              }}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
