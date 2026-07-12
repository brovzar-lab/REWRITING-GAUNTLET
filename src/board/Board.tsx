import { useRef } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { StoryCard } from './StoryCard';
import { ConnectionLayer } from './connections';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';
import './board.css';

/** Pure drop resolution so reordering is testable without simulating a drag. */
export function resolveDragEnd(activeId: string, overId: string | null): void {
  if (!overId || activeId === overId) return;
  const { screenplay, reorderScenes } = useAppStore.getState();
  const from = screenplay.scenes.findIndex((s) => s.id === activeId);
  const to = screenplay.scenes.findIndex((s) => s.id === overId);
  if (from === -1 || to === -1) return;
  reorderScenes(from, to);
}

export function Board() {
  const scenes = useAppStore((s) => s.screenplay.scenes);
  const connections = useAppStore((s) => s.connections);
  const lang = useAppStore((s) => s.lang);
  const fullBoard = useAppStore((s) => s.fullBoard);
  const setFullBoard = useAppStore((s) => s.setFullBoard);
  const t = useT();
  const containerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  function onDragEnd(event: DragEndEvent) {
    resolveDragEnd(String(event.active.id), event.over ? String(event.over.id) : null);
  }

  return (
    <section className={`board${fullBoard ? ' is-full' : ''}`} aria-label={t('board.title')}>
      <div className="board-header">
        <h2 className="panel-title">{t('board.title')}</h2>
        <p className="board-hint">{t('board.dragHint')}</p>
        <button
          type="button"
          className="seg-button"
          aria-pressed={fullBoard}
          data-editor-exit
          onClick={() => setFullBoard(!fullBoard)}
        >
          {fullBoard ? t('board.collapse') : t('board.expand')}
        </button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="board-canvas" ref={containerRef}>
          <ConnectionLayer connections={connections} containerRef={containerRef} lang={lang} />
          <div className="card-row">
            {scenes.map((scene) => (
              <StoryCard key={scene.id} scene={scene} />
            ))}
          </div>
        </div>
      </DndContext>
    </section>
  );
}
