import '@testing-library/jest-dom/vitest';

// jsdom has no ResizeObserver; the board's connection layer observes its container.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
