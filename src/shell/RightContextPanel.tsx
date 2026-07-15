import { useAppStore } from '../store/appStore';
import { PassWorkspace } from '../panels/PassWorkspace';
import { EvidenceInspector } from '../panels/EvidenceInspector';
import { GamePlanPanel } from '../panels/GamePlanPanel';
import { WhatWorkedPin } from './WhatWorkedPin';

/** One contextual panel at a time. The journey strip owns "what do I do
    next" now; the panel's fallback is Evidence. */
export function RightContextPanel({ override }: { override?: 'passes' | 'evidence' | 'gameplan' }) {
  const stored = useAppStore((s) => s.rightWorkspace);
  const rightWorkspace = override ?? stored;
  return (
    <div className="right-context" role="region" aria-label="Context" data-editor-exit tabIndex={-1}>
      {rightWorkspace === 'passes' ? (
        <>
          <WhatWorkedPin />
          <PassWorkspace />
        </>
      ) : rightWorkspace === 'gameplan' ? (
        <>
          <WhatWorkedPin />
          <GamePlanPanel />
        </>
      ) : (
        <EvidenceInspector />
      )}
    </div>
  );
}
