import { Fragment, type JSX } from 'react'

import type { DirectorDebugSnapshot, DirectorMode } from '../core/director'

interface DirectorDebugOverlayProps {
  snapshot: DirectorDebugSnapshot
}

const MODE_LABEL: Record<DirectorMode, string> = {
  application: 'Application',
  recall: 'Recall',
  boss_setup: 'Boss setup',
}

const formatPercent = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '—'
  }

  return `${Math.round(value * 100)}%`
}

const DirectorDebugOverlay = ({ snapshot }: DirectorDebugOverlayProps): JSX.Element => {
  const distributionRows = (Object.keys(MODE_LABEL) as DirectorMode[]).map((mode) => {
    const target = snapshot.distribution.target[mode]
    const actual = snapshot.distribution.actual[mode]
    const deficit = snapshot.distribution.deficits[mode]

    return {
      mode,
      target,
      actual,
      deficit,
    }
  })

  const candidates = snapshot.candidates.slice(0, 5)

  return (
    <aside className="director-debug-overlay" role="log" aria-live="polite">
      <header>
        <h4>Director Debug</h4>
        <p className="small-print">Overlay {snapshot.enabled ? 'active' : 'inactive'}</p>
      </header>

      {snapshot.lastDecision ? (
        <section className="debug-section">
          <strong>Last decision</strong>
          <p>
            Day {snapshot.lastDecision.day} · {snapshot.lastDecision.difficulty.toUpperCase()} ·
            Mode {MODE_LABEL[snapshot.lastDecision.mode]}
            {snapshot.lastDecision.mode !== snapshot.lastDecision.intendedMode ? (
              <span className="small-print">
                {' '}
                (target {MODE_LABEL[snapshot.lastDecision.intendedMode]})
              </span>
            ) : null}
          </p>
          {snapshot.lastDecision.event ? (
            <p className="small-print">Event {snapshot.lastDecision.event.id}</p>
          ) : (
            <p className="small-print">No event available. Content pack may be empty.</p>
          )}
        </section>
      ) : (
        <p className="small-print">No director decisions recorded yet.</p>
      )}

      <section className="debug-section">
        <strong>Distribution</strong>
        <dl>
          {distributionRows.map((row) => (
            <Fragment key={row.mode}>
              <dt>{MODE_LABEL[row.mode]}</dt>
              <dd>
                {formatPercent(row.actual)} of {formatPercent(row.target)} target
                <span className="small-print"> · Δ {row.deficit.toFixed(2)}</span>
              </dd>
            </Fragment>
          ))}
        </dl>
      </section>

      <section className="debug-section">
        <strong>Top candidates</strong>
        {candidates.length > 0 ? (
          <ol>
            {candidates.map((candidate) => (
              <li key={candidate.eventId}>
                <div>
                  <span>{candidate.eventId}</span>
                  <span className="small-print"> · {candidate.topic}</span>
                </div>
                <div className="small-print">
                  Weight {candidate.weight.toFixed(2)} · {MODE_LABEL[candidate.mode]}
                </div>
                <div className="small-print">
                  {Object.entries(candidate.breakdown)
                    .map(
                      ([key, value]) =>
                        `${key[0]?.toUpperCase()}${key.slice(1)}:${value.toFixed(2)}`,
                    )
                    .join(' ')}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="small-print">No candidate events were available.</p>
        )}
      </section>

      {snapshot.lastContext ? (
        <section className="debug-section">
          <strong>Last context</strong>
          <p className="small-print">
            Mastery focus:{' '}
            {Object.entries(snapshot.lastContext.masteryByTopic)
              .sort(([, a], [, b]) => a - b)
              .slice(0, 3)
              .map(([topic, score]) => `${topic} ${(score * 100).toFixed(0)}%`)
              .join(', ')}
          </p>
          <p className="small-print">
            Mistakes tracked:{' '}
            {snapshot.lastContext.recentMistakes.length > 0
              ? snapshot.lastContext.recentMistakes
                  .map((mistake) => (typeof mistake === 'string' ? mistake : mistake.topic))
                  .join(', ')
              : 'none'}
          </p>
        </section>
      ) : null}
    </aside>
  )
}

export default DirectorDebugOverlay
