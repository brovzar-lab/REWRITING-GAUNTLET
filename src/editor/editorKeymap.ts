import { keymap } from 'prosemirror-keymap';
import type { Plugin } from 'prosemirror-state';
import { useAppStore } from '../store/appStore';

/** Zoom is rendering-only: these commands touch the store, never the doc. */
export function zoomKeymap(): Plugin {
  const step = 0.1;
  return keymap({
    'Mod-=': () => {
      const s = useAppStore.getState();
      s.setZoom(Math.round((s.zoom + step) * 10) / 10);
      return true;
    },
    'Mod--': () => {
      const s = useAppStore.getState();
      s.setZoom(Math.round((s.zoom - step) * 10) / 10);
      return true;
    },
    'Mod-0': () => {
      useAppStore.getState().setZoom(1);
      return true;
    },
  });
}
