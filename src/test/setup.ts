import '@testing-library/jest-dom/vitest';

// jsdom has no matchMedia; the layout uses it to pick the board dock.
// Default to desktop width (side dock) — tests that want the bottom drawer
// call useAppStore.getState().setBoardDock('bottom') after render.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  window.matchMedia = (query: string) =>
    ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// jsdom has no layout: ProseMirror's coordsAtPos reads client rects whenever a
// transaction carries scrollIntoView (undo/redo from prosemirror-history do).
if (typeof Range !== 'undefined' && typeof Range.prototype.getClientRects !== 'function') {
  const zeroRect = {
    x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0,
    toJSON: () => ({}),
  } as DOMRect;
  Range.prototype.getClientRects = () =>
    ({ length: 1, 0: zeroRect, item: () => zeroRect, [Symbol.iterator]: [zeroRect][Symbol.iterator] }) as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect = () => zeroRect;
}

// jsdom has no ResizeObserver; the board's connection layer observes its container.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
