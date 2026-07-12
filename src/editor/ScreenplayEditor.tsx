import { useEffect, useRef } from 'react';
import { EditorState, TextSelection, type Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap, chainCommands, newlineInCode } from 'prosemirror-commands';
import { history, redo, undo } from 'prosemirror-history';
import type { Node as PMNode } from 'prosemirror-model';
import { screenplaySchema } from './schema';
import { buildDoc, parseDoc } from './docSync';
import { nextElementOnEnter, nextElementOnTab } from './elementCycling';
import { paginationPlugin } from './paginationPlugin';
import { revisionPlugin } from './revisionPlugin';
import { zoomKeymap } from './editorKeymap';
import type { ElementType } from '../model/screenplay';
import { useAppStore } from '../store/appStore';
import './editor.css';

function currentBlock(state: EditorState): { node: PMNode; pos: number } | null {
  const { $from } = state.selection;
  if ($from.depth < 1) return null;
  return { node: $from.node(1), pos: $from.before(1) };
}

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

export interface ScreenplayEditorProps {
  onReady?: (view: EditorView) => void;
}

export function ScreenplayEditor({ onReady }: ScreenplayEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const syncingFromEditor = useRef(false);
  const zoom = useAppStore((s) => s.zoom);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const store = useAppStore;
    const state = EditorState.create({
      doc: buildDoc(store.getState().screenplay),
      plugins: [
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
      ],
    });

    const view = new EditorView(host, {
      state,
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
        }
      },
    });
    viewRef.current = view;
    onReady?.(view);

    // Outside changes (navigator, board, hydration, revision set) rebuild the
    // doc/decorations and move the cursor.
    let prevScreenplay = store.getState().screenplay;
    let prevSelection = store.getState().selection;
    let prevBaseline = store.getState().revisionBaseline;
    const unsubscribe = store.subscribe((s) => {
      const outsideDocChange = s.screenplay !== prevScreenplay && !syncingFromEditor.current;
      const revisionChange = s.revisionBaseline !== prevBaseline;
      if (outsideDocChange || revisionChange) {
        const doc = outsideDocChange ? buildDoc(s.screenplay) : view.state.doc;
        view.updateState(
          EditorState.create({ doc, plugins: view.state.plugins }),
        );
      }
      prevScreenplay = s.screenplay;
      prevBaseline = s.revisionBaseline;

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
      style={{ ['--sp-zoom' as string]: zoom }}
    >
      <div className="sp-page" ref={hostRef} aria-label="Screenplay page" />
    </div>
  );
}
