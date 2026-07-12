import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { EditorView } from 'prosemirror-view';
import { TextSelection } from 'prosemirror-state';
import { ScreenplayEditor } from './ScreenplayEditor';
import { useAppStore, elementText } from '../store/appStore';

function selectElement(view: EditorView, elementId: string) {
  let pos: number | null = null;
  view.state.doc.forEach((node, offset) => {
    if (node.attrs.elementId === elementId) pos = offset + 1 + node.content.size;
  });
  if (pos === null) throw new Error(`element ${elementId} not in doc`);
  view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, pos)));
}

describe('ScreenplayEditor', () => {
  beforeEach(() => {
    useAppStore.getState().resetToSample();
  });

  it('typing flows into the canonical model (store is source of truth)', async () => {
    let view!: EditorView;
    render(<ScreenplayEditor onReady={(v) => (view = v)} />);
    selectElement(view, 'sc2-e5');
    view.dispatch(view.state.tr.insertText(' EXTRA'));
    expect(elementText(useAppStore.getState().screenplay, 'sc2', 'sc2-e5')).toBe(
      'You never stopped keeping score, Papá. EXTRA',
    );
  });

  it('Enter after a character element creates a dialogue element in the model', () => {
    let view!: EditorView;
    render(<ScreenplayEditor onReady={(v) => (view = v)} />);
    selectElement(view, 'sc2-e3'); // MARISOL (character)
    const handled = view.someProp('handleKeyDown', (f) =>
      f(view, new KeyboardEvent('keydown', { key: 'Enter' })),
    );
    expect(handled).toBe(true);
    const scene = useAppStore.getState().screenplay.scenes.find((s) => s.id === 'sc2')!;
    const idx = scene.elements.findIndex((e) => e.id === 'sc2-e3');
    expect(scene.elements[idx + 1].type).toBe('dialogue');
  });

  it('Tab retypes an action element to character in the model', () => {
    let view!: EditorView;
    render(<ScreenplayEditor onReady={(v) => (view = v)} />);
    selectElement(view, 'sc1-e2'); // action
    const handled = view.someProp('handleKeyDown', (f) =>
      f(view, new KeyboardEvent('keydown', { key: 'Tab' })),
    );
    expect(handled).toBe(true);
    const scene = useAppStore.getState().screenplay.scenes.find((s) => s.id === 'sc1')!;
    expect(scene.elements.find((e) => e.id === 'sc1-e2')!.type).toBe('character');
  });

  it('publishes the editor cursor position as the app selection', () => {
    let view!: EditorView;
    render(<ScreenplayEditor onReady={(v) => (view = v)} />);
    selectElement(view, 'sc8-e5');
    expect(useAppStore.getState().selection).toEqual({ sceneId: 'sc8', elementId: 'sc8-e5' });
  });
});
