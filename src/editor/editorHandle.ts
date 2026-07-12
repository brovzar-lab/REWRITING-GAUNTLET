import type { EditorView } from 'prosemirror-view';

/** The one live ProseMirror view, registered by ScreenplayEditor so toolbar
    controls can dispatch commands without threading refs through the layout. */
let current: EditorView | null = null;

export function registerEditorView(view: EditorView | null): void {
  current = view;
}

export function getEditorView(): EditorView | null {
  return current;
}
