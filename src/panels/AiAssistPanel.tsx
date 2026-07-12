import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { resolveProvider } from '../ai';
import { EPPS_PASSES } from '../model/passes';
import { useT } from '../i18n/strings';
import type { Finding } from '../workflow/types';
import type { EvidenceStatus } from '../model/evidence';

const STATUS_ICON: Record<EvidenceStatus, string> = {
  clear: '✓',
  uncertain: '?',
  priority_concern: '!',
};

function FindingCard({ finding }: { finding: Finding }) {
  const screenplay = useAppStore((s) => s.screenplay);
  const select = useAppStore((s) => s.select);
  const approveProposal = useAppStore((s) => s.approveProposal);
  const rejectFinding = useAppStore((s) => s.rejectFinding);
  const t = useT();
  const [error, setError] = useState<string | null>(null);

  const sceneOf = (sceneId: string) => screenplay.scenes.find((s) => s.id === sceneId);

  return (
    <li className={`ai-finding source-ai resolution-${finding.resolution}`}>
      <span className="evidence-meta">
        <span className="source-chip source-ai">{t('source.ai')}</span>
        <span className="claim-label">{t(`claim.${finding.claimType}`)}</span>
        <span className="ai-provider-label">
          {finding.provider === 'local' ? t('ai.providerLocal') : t('ai.providerCloud')}
        </span>
      </span>
      <p className="ai-finding-summary">{finding.summary}</p>
      <span className={`evidence-status status-${finding.status}`}>
        <span data-status-icon aria-hidden="true">
          {STATUS_ICON[finding.status]}
        </span>
        {t(`status.${finding.status}`)}
      </span>
      <span className="control-label">{t('ai.evidenceCited')}</span>
      <span className="ai-citations">
        {finding.citations.map((c) => {
          const scene = sceneOf(c.sceneId);
          return (
            <button
              key={`${finding.id}-${c.elementId}`}
              type="button"
              className="seg-button ai-citation"
              onClick={() => select({ sceneId: c.sceneId, elementId: c.elementId })}
            >
              {scene ? `${scene.number} · ${scene.slug}` : c.sceneId}
            </button>
          );
        })}
      </span>
      {finding.proposal && (
        <div className="ai-proposal">
          <span className="control-label">{t('ai.current')}</span>
          <p className="ai-proposal-text ai-proposal-old">{finding.proposal.oldText}</p>
          <span className="control-label">{t('ai.proposed')}</span>
          <p className="ai-proposal-text ai-proposal-new">{finding.proposal.newText}</p>
          <p className="import-note">{finding.proposal.rationale}</p>
        </div>
      )}
      {finding.resolution === 'open' ? (
        <div className="ai-finding-actions">
          <button type="button" className="seg-button" onClick={() => rejectFinding(finding.id)}>
            {t('ai.reject')}
          </button>
          {finding.proposal && (
            <button
              type="button"
              className="seg-button ai-approve"
              onClick={() => {
                try {
                  approveProposal(finding.id);
                  setError(null);
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                }
              }}
            >
              {t('ai.approve')}
            </button>
          )}
        </div>
      ) : (
        <span className={`ai-resolution ai-resolution-${finding.resolution}`}>
          {finding.resolution === 'approved' ? t('ai.approved') : t('ai.rejected')}
        </span>
      )}
      {error && (
        <p className="inspector-error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}

/** The AI Assist panel: per active pass, Diagnose produces labeled hypotheses
    with citations; each scene-level proposal needs the writer's approval.
    Locked until the private annotated read is done — the writer reads first. */
export function AiAssistPanel() {
  const screenplay = useAppStore((s) => s.screenplay);
  const connections = useAppStore((s) => s.connections);
  const activePassId = useAppStore((s) => s.activePassId);
  const readComplete = useAppStore((s) => s.workflow.annotatedReadComplete);
  const cloudConsent = useAppStore((s) => s.workflow.cloudAiConsent);
  const findings = useAppStore((s) => s.workflow.findings);
  const setFindings = useAppStore((s) => s.setFindings);
  const setPassRunState = useAppStore((s) => s.setPassRunState);
  const passRuns = useAppStore((s) => s.workflow.passRuns);
  const completePass = useAppStore((s) => s.completePass);
  const enterReadMode = useAppStore((s) => s.enterReadMode);
  const setAiSettingsOpen = useAppStore((s) => s.setAiSettingsOpen);
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pass = EPPS_PASSES.find((p) => p.id === activePassId);
  const provider = resolveProvider(cloudConsent);
  const passFindings = pass ? findings.filter((f) => f.passId === pass.id) : [];
  const open = passFindings.filter((f) => f.resolution === 'open');
  const resolved = passFindings.filter((f) => f.resolution !== 'open');

  const diagnose = async () => {
    if (!pass || busy) return;
    setBusy(true);
    setError(null);
    setPassRunState(pass.id, 'diagnosing');
    try {
      const passRunId = `run-${pass.id}-${crypto.randomUUID()}`;
      const result = await provider.diagnose({
        screenplay,
        connections,
        pass,
        passRunId,
        now: Date.now(),
      });
      setFindings(passRunId, result);
      setPassRunState(pass.id, 'reviewing');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPassRunState(pass.id, 'not_started');
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="ai-panel" aria-label={t('ai.assist')}>
      <div className="ai-panel-header">
        <h2 className="panel-title">{t('ai.assist')}</h2>
        <span className="ai-provider-label">{provider.id === 'cloud' ? t('ai.activeCloud') : t('ai.activeLocal')}</span>
        <button type="button" className="seg-button" onClick={() => setAiSettingsOpen(true)}>
          {t('ai.settings')}
        </button>
      </div>

      {!readComplete ? (
        <div className="ai-locked">
          <p className="inspector-hint">{t('ai.locked')}</p>
          <button type="button" className="seg-button" onClick={enterReadMode}>
            {t('read.enter')}
          </button>
        </div>
      ) : !pass ? (
        <p className="inspector-hint">{t('ai.noPass')}</p>
      ) : (
        <>
          <div className="ai-pass-row">
            <span className="ai-pass-name">{pass.name}</span>
            <span className="ai-pass-actions">
              <button type="button" className="seg-button" disabled={busy} onClick={() => void diagnose()}>
                {busy ? t('ai.diagnosing') : t('ai.diagnose')}
              </button>
              {passRuns[pass.id] === 'reviewing' && (
                <button type="button" className="seg-button" onClick={() => void completePass(pass.id)}>
                  {t('ai.completePass')}
                </button>
              )}
            </span>
          </div>
          {error && (
            <p className="inspector-error" role="alert">
              {t('ai.error')}: {error}
            </p>
          )}
          {passFindings.length === 0 && !busy && !error && <p className="inspector-hint">{t('ai.noFindings')}</p>}
          {passFindings.length > 0 && (
            <ul className="ai-findings">
              {[...open, ...resolved].map((f) => (
                <FindingCard key={f.id} finding={f} />
              ))}
            </ul>
          )}
        </>
      )}
    </aside>
  );
}
