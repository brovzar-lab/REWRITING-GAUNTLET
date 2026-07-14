import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { resolveProvider } from '../ai';
import { EPPS_PASSES } from '../model/passes';
import { useT, type StringKey } from '../i18n/strings';
import { PassToolSection } from './PassToolSection';
import type { Finding } from '../workflow/types';
import type { EvidenceStatus } from '../model/evidence';

const STATUS_ICON: Record<EvidenceStatus, string> = {
  clear: '✓',
  uncertain: '?',
  priority_concern: '!',
};

function FindingCard({ finding, index }: { finding: Finding; index: number }) {
  const screenplay = useAppStore((s) => s.screenplay);
  const evidence = useAppStore((s) => s.evidence);
  const select = useAppStore((s) => s.select);
  const approveProposal = useAppStore((s) => s.approveProposal);
  const rejectFinding = useAppStore((s) => s.rejectFinding);
  const t = useT();
  const [error, setError] = useState<string | null>(null);

  const sceneOf = (sceneId: string) => screenplay.scenes.find((s) => s.id === sceneId);
  const citedElementIds = new Set(finding.citations.map((c) => c.elementId));
  const notes = evidence.filter((e) => e.passId === finding.passId && citedElementIds.has(e.elementId));

  return (
    <li
      className={`ai-finding source-ai resolution-${finding.resolution}`}
      data-cited-element={finding.citations[0]?.elementId}
    >
      <span className="evidence-meta finding-head">
        <span className="finding-index">#{index}</span>
        <span className={`severity-chip evidence-status status-${finding.status}`}>
          <span data-status-icon aria-hidden="true">
            {STATUS_ICON[finding.status]}
          </span>
          {t(`status.${finding.status}`)}
        </span>
        <span className="claim-label">{t(`claim.${finding.claimType}`)}</span>
      </span>
      <p className="ai-finding-summary">{finding.summary}</p>
      {finding.proposal && (
        <div className="ai-proposal">
          <div className="finding-section">
            <span className="control-label">{t('finding.suggestion')}</span>
            <p className="finding-rationale">{finding.proposal.rationale}</p>
          </div>
          <div className="finding-section">
            <span className="control-label">{t('finding.example')}</span>
            <p className="ai-proposal-text ai-proposal-new">{finding.proposal.newText}</p>
          </div>
          <div className="finding-section">
            <span className="control-label">{t('finding.current')}</span>
            <p className="ai-proposal-text ai-proposal-old">{finding.proposal.oldText}</p>
          </div>
        </div>
      )}
      <div className="finding-section">
        <span className="control-label">{t('finding.source')}</span>
        <span className="ai-provider-label">
          {finding.provider === 'local' ? t('ai.providerLocal') : t('ai.providerCloud')}
        </span>
      </div>
      {finding.confidence != null && (
        <div className="finding-section">
          <span className="control-label">{t('finding.confidence')}</span>
          <span className="confidence-value">{Math.round(finding.confidence * 100)}%</span>
          <span className="confidence-meter" aria-hidden="true">
            <i style={{ width: `${Math.round(finding.confidence * 100)}%` }} />
          </span>
        </div>
      )}
      <div className="finding-section">
        <span className="control-label">{t('finding.linked')}</span>
        <ul className="finding-citations">
          {finding.citations.map((c) => {
            const scene = sceneOf(c.sceneId);
            const where = scene ? `${t('status.scene')} ${scene.number} · ${scene.slug}` : c.sceneId;
            return (
              <li key={`${finding.id}-${c.elementId}`} className="finding-citation">
                <span className="finding-citation-where">{where}</span>
                <button
                  type="button"
                  className="seg-button ai-citation"
                  aria-label={`${t('finding.goto')} — ${where}`}
                  onClick={() => select({ sceneId: c.sceneId, elementId: c.elementId })}
                >
                  {t('finding.goto')}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {notes.length > 0 && (
        <div className="finding-section">
          <span className="control-label">{t('finding.notes')}</span>
          <ul className="finding-notes">
            {notes.map((n) => (
              <li key={n.id} className="finding-note">
                <span className={`source-chip source-${n.source}`}>{t(`source.${n.source}`)}</span>
                <span className="finding-note-summary">{n.summary}</span>
              </li>
            ))}
          </ul>
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
          {error} {t('ai.approveErrorHelp')}
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
  const scenePoints = useAppStore((s) => s.scenePoints);
  const highPoints = useAppStore((s) => s.highPoints);
  const select = useAppStore((s) => s.select);
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
  // Writer-marked cut candidates surface in the Scene pass, visibly writer-sourced.
  const cutCandidates =
    pass.id === 'scene'
      ? screenplay.scenes.filter((s) => scenePoints[s.id]?.verdict === 'cut_candidate')
      : [];

  const diagnose = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setPassRunState(pass.id, 'diagnosing');
    try {
      const passRunId = `run-${pass.id}-${crypto.randomUUID()}`;
      const result = await provider.diagnose({ screenplay, connections, scenePoints, highPoints, pass, passRunId, now: Date.now() });
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

      <PassToolSection passId={pass.id} />

      {cutCandidates.length > 0 && (
        <section className="sp-cutlist" aria-label={t('sp.cutlist')}>
          <span className="control-label">{t('sp.cutlist')}</span>
          <ul className="finding-notes">
            {cutCandidates.map((scene) => (
              <li key={scene.id} className="finding-note">
                <span className="source-chip source-writer">{t('source.writer')}</span>
                <button
                  type="button"
                  className="gp-anchor"
                  onClick={() => select({ sceneId: scene.id, elementId: scene.elements[0].id })}
                >
                  {t('card.scene')} {scene.number}
                </button>
                <span className="finding-note-summary">{scenePoints[scene.id]?.point || scene.slug}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

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
              {t('ai.error')}: {error} {t('ai.errorHelp')}
            </p>
          )}
          {passFindings.length === 0 && !busy && !error && (
            <p className="inspector-hint">
              {runState === 'reviewing' || runState === 'complete'
                ? t('ai.checkedEmpty')
                    .replace('{n}', String(screenplay.scenes.length))
                    .replace('{focus}', t(`checked.${pass.id}` as StringKey))
                : t('ai.notRun')}
            </p>
          )}
          {passFindings.length > 0 && (
            <ul className="ai-findings">
              {[...open, ...resolved].map((f, i) => (
                <FindingCard key={f.id} finding={f} index={i + 1} />
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
