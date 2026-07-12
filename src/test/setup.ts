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

// jsdom has no ResizeObserver; the board's connection layer observes its container.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
