import { useAppStore } from '../store/appStore';
import { JourneyGuide } from './JourneyGuide';
import { PassWorkspace } from '../panels/PassWorkspace';
import { EvidenceInspector } from '../panels/EvidenceInspector';
import { GamePlanPanel } from '../panels/GamePlanPanel';

/** One contextual panel at a time — the answer to "what do I do next?".
    Driven by the rail / state, never all workflows at once. */
export function RightContextPanel({ override }: { override?: 'journey' | 'passes' | 'evidence' | 'gameplan' }) {
  const stored = useAppStore((s) => s.rightWorkspace);
  const rightWorkspace = override ?? stored;
  return (
    <div className="right-context" role="region" aria-label="Context" data-editor-exit tabIndex={-1}>
      {rightWorkspace === 'passes' ? (
        <PassWorkspace />
      ) : rightWorkspace === 'evidence' ? (
        <EvidenceInspector />
      ) : rightWorkspace === 'gameplan' ? (
        <GamePlanPanel />
      ) : (
        <JourneyGuide />
      )}
    </div>
  );
}
