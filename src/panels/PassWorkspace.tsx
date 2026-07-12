import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { resolveProvider } from '../ai';
import { EPPS_PASSES } from '../model/passes';
import { useT, type StringKey } from '../i18n/strings';
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

/** The guided pass workspace. Selecting a pass in the tray opens this:
    the pass objective, what it examines, Diagnose, the approve/reject queue,
    progress, Complete pass, and the recommended next pass. Diagnosis stays
    locked until the private annotated read is done; the guidance does not. */
export function PassWorkspace() {
  const screenplay = useAppStore((s) => s.screenplay);
  const connections = useAppStore((s) => s.connections);
  const activePassId = useAppStore((s) => s.activePassId);
  const setActivePass = useAppStore((s) => s.setActivePass);
  const readComplete = useAppStore((s) => s.workflow.annotatedReadComplete);
  const cloudConsent = useAppStore((s) => s.workflow.cloudAiConsent);
  const findings = useAppStore((s) => s.workflow.findings);
  const evidence = useAppStore((s) => s.evidence);
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

  if (!pass) {
    return (
      <aside className="ai-panel" aria-label={t('inspector.tabPass')}>
        <div className="ai-panel-header">
          <h2 className="panel-title">{t('inspector.tabPass')}</h2>
          <span className="ai-provider-label">
            {provider.id === 'cloud' ? t('ai.activeCloud') : t('ai.activeLocal')}
          </span>
          <button type="button" className="seg-button" onClick={() => setAiSettingsOpen(true)}>
            {t('ai.settings')}
          </button>
        </div>
        <p className="inspector-hint">{t('ai.noPass')}</p>
      </aside>
    );
  }

  const runState = passRuns[pass.id];
  const nextPass = EPPS_PASSES.find((p) => p.order === pass.order + 1);
  const passFindings = findings.filter((f) => f.passId === pass.id);
  const open = passFindings.filter((f) => f.resolution === 'open');
  const resolved = passFindings.filter((f) => f.resolution !== 'open');
  const proposals = passFindings.filter((f) => f.proposal);
  const proposalsResolved = proposals.filter((f) => f.resolution !== 'open');
  const passNotes = evidence.filter((e) => e.passId === pass.id);
  const examines = t(`pass.ex.${pass.id}` as StringKey).split('|');

  const diagnose = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setPassRunState(pass.id, 'diagnosing');
    try {
      const passRunId = `run-${pass.id}-${crypto.randomUUID()}`;
      const result = await provider.diagnose({ screenplay, connections, pass, passRunId, now: Date.now() });
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
    <aside className="ai-panel pass-workspace" data-pass-workspace={pass.id} aria-label={t('inspector.tabPass')}>
      <div className="ai-panel-header">
        <h2 className="panel-title">
          {t('pass.pass')} {pass.order} {t('pass.of')} {EPPS_PASSES.length} · {pass.name}
        </h2>
        {runState && runState !== 'not_started' && (
          <span className={`chip-state chip-state-${runState}`}>{t(`passState.${runState}`)}</span>
        )}
      </div>

      <section className="pass-brief" aria-label={t('pass.objective')}>
        <span className="control-label">{t('pass.objective')}</span>
        <p className="pass-objective">{t(`pass.obj.${pass.id}` as StringKey)}</p>
        <span className="control-label">{t('pass.examines')}</span>
        <ul className="pass-examines">
          {examines.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {!readComplete ? (
        <div className="ai-locked">
          <p className="inspector-hint">{t('ai.locked')}</p>
          <button type="button" className="seg-button" onClick={enterReadMode}>
            {t('read.enter')}
          </button>
        </div>
      ) : (
        <>
          <div className="ai-pass-row">
            <span className="pass-progress" data-testid="pass-progress">
              {proposals.length > 0 && (
                <>
                  {proposalsResolved.length} {t('pass.of')} {proposals.length} {t('pass.resolved')} ·{' '}
                </>
              )}
              {passNotes.length} {t('pass.notes')}
            </span>
            <span className="ai-pass-actions">
              <button type="button" className="seg-button" disabled={busy} onClick={() => void diagnose()}>
                {busy ? t('ai.diagnosing') : t('ai.diagnose')}
              </button>
              <button
                type="button"
                className="seg-button"
                disabled={runState !== 'reviewing'}
                onClick={() => void completePass(pass.id)}
              >
                {t('ai.completePass')}
              </button>
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

      <div className="pass-footer">
        <span className="ai-provider-label">
          {provider.id === 'cloud' ? t('ai.activeCloud') : t('ai.activeLocal')}
        </span>
        <button type="button" className="seg-button" onClick={() => setAiSettingsOpen(true)}>
          {t('ai.settings')}
        </button>
        {nextPass && (
          <button type="button" className="seg-button pass-next" onClick={() => setActivePass(nextPass.id)}>
            {t('pass.next')}: {nextPass.order} {nextPass.name}
          </button>
        )}
      </div>
    </aside>
  );
}
