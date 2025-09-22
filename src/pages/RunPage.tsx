import { useCallback, useEffect, useMemo, useState } from 'react'

import DirectorDebugOverlay from '../components/DirectorDebugOverlay'
import {
  createDirector,
  type DirectorDecision,
  type DirectorDebugSnapshot,
  type DirectorMistake,
} from '../core/director'
import { defaultMeters, type MeterSnapshot } from '../core/scoring'
import { useActivePack } from '../data/packs'
import {
  applyModifiersToOutcome,
  campaignBuildings,
  collectModifierNotes,
  filterEventsForActiveModifiers,
  resolveBuildingTopics,
  useCampaignState,
} from '../core/campaign'

const clamp = (value: number, min = 0, max = 1): number => {
  return Math.min(max, Math.max(min, value))
}

const RunPage = (): JSX.Element => {
  const pack = useActivePack()
  const { selectedBuildingId, activeModifiers } = useCampaignState()

  const selectedBuilding = useMemo(() => {
    return (
      campaignBuildings.find((building) => building.id === selectedBuildingId) ??
      campaignBuildings[0]
    )
  }, [selectedBuildingId])

  const buildingTopics = useMemo(
    () => resolveBuildingTopics(selectedBuilding, pack.topics),
    [selectedBuilding, pack.topics],
  )

  const baseEvents = useMemo(() => {
    const scoped = pack.events.filter((event) => buildingTopics.includes(event.topic))
    return scoped.length > 0 ? scoped : pack.events
  }, [pack.events, buildingTopics])

  const directorEvents = useMemo(
    () => filterEventsForActiveModifiers(baseEvents, activeModifiers),
    [baseEvents, activeModifiers],
  )

  const modifierNotes = useMemo(() => collectModifierNotes(activeModifiers), [activeModifiers])

  const director = useMemo(
    () =>
      createDirector({
        events: directorEvents,
        difficultyCurve: pack.difficultyCurve,
      }),
    [pack.difficultyCurve, directorEvents],
  )

  const [day, setDay] = useState(1)
  const [masteryByTopic, setMasteryByTopic] = useState<Record<string, number>>({})
  const [meterStates, setMeterStates] = useState<Record<string, number>>({})
  const [recentMistakes, setRecentMistakes] = useState<DirectorMistake[]>([])
  const [decision, setDecision] = useState<DirectorDecision | null>(null)
  const [debugSnapshot, setDebugSnapshot] = useState<DirectorDebugSnapshot | null>(null)

  useEffect(() => {
    setDay(1)
    setMasteryByTopic(() =>
      pack.topics.reduce<Record<string, number>>((acc, topic, index) => {
        const baseline = clamp(0.8 - index * 0.1)
        acc[topic] = Number(baseline.toFixed(2))
        return acc
      }, {}),
    )
    setMeterStates(() => ({ ...defaultMeters }))
    setRecentMistakes(() =>
      pack.topics.slice(0, 2).map((topic, index) => ({
        topic,
        timestamp: new Date(Date.now() - index * 45 * 60 * 1000).toISOString(),
      })),
    )
  }, [pack, selectedBuilding.id])

  useEffect(() => {
    const nextDecision = director.planNext({
      day,
      masteryByTopic,
      recentMistakes,
      meterStates,
      difficultyCurve: pack.difficultyCurve,
    })

    setDecision(nextDecision)
  }, [director, day, masteryByTopic, meterStates, recentMistakes, pack.difficultyCurve])

  const adjustedOutcome = useMemo(() => {
    if (!decision?.event?.meterImpact) {
      return null
    }

    return applyModifiersToOutcome(decision.event, decision.event.meterImpact, activeModifiers)
  }, [decision, activeModifiers])

  const combinedModifiers = useMemo(() => {
    if (!decision) {
      return modifierNotes
    }

    return [...decision.modifiers, ...modifierNotes]
  }, [decision, modifierNotes])

  useEffect(() => {
    if (debugSnapshot?.enabled) {
      setDebugSnapshot(director.debug('peek'))
    }
  }, [director, decision, debugSnapshot?.enabled])

  const handleAdvanceDay = useCallback(() => {
    setDay((current) => current + 1)

    setMasteryByTopic((current) => {
      if (!decision?.event) {
        return current
      }

      const next = { ...current }
      const existing = next[decision.event.topic] ?? 0.5
      next[decision.event.topic] = Number(clamp(existing + 0.05).toFixed(2))
      return next
    })

    setMeterStates((current) => {
      if (!adjustedOutcome) {
        return current
      }

      const next = { ...current }

      for (const [meter, impact] of Object.entries(adjustedOutcome)) {
        if (meter === 'summary' || typeof impact !== 'number') {
          continue
        }

        const baseline =
          current[meter] ?? (defaultMeters as MeterSnapshot)[meter as keyof MeterSnapshot] ?? 60
        next[meter] = Math.max(0, Math.min(100, Math.round(baseline + impact * 2)))
      }

      return next
    })

    if (decision?.event) {
      setRecentMistakes((current) => {
        const entry: DirectorMistake = {
          topic: decision.event!.topic,
          eventId: decision.event!.id,
          timestamp: new Date().toISOString(),
        }

        return [...current.slice(-4), entry]
      })
    }
  }, [adjustedOutcome, decision])

  const handleToggleDebug = useCallback(() => {
    const snapshot = director.debug()
    setDebugSnapshot(snapshot.enabled ? snapshot : null)
  }, [director])

  return (
    <section className="scenario-run">
      <header className="run-header">
        <div>
          <h2>Scenario Director</h2>
          <p className="small-print">
            Day {day} · Active difficulty {decision?.difficulty ?? pack.difficultyCurve.start} ·
            Building {selectedBuilding.name}
          </p>
        </div>
        <div className="button-row">
          <button type="button" onClick={handleAdvanceDay}>
            Advance simulation day
          </button>
          <button type="button" className="secondary" onClick={handleToggleDebug}>
            Toggle debug overlay
          </button>
        </div>
      </header>

      {decision?.event ? (
        <article className="card">
          <header>
            <h3>{decision.event.topic}</h3>
            <p className="badge">Pressure {decision.event.pressure}</p>
          </header>
          <p>{decision.event.description}</p>
          <p className="small-print">
            Mode {decision.mode} · Target {decision.intendedMode}
            {decision.event.citation ? ` · Source: ${decision.event.citation}` : ''}
          </p>

          {adjustedOutcome ? (
            <p className="small-print">Outcome: {adjustedOutcome.summary}</p>
          ) : null}

          {combinedModifiers.length > 0 ? (
            <ul className="modifier-list">
              {combinedModifiers.map((modifier) => (
                <li key={modifier}>{modifier}</li>
              ))}
            </ul>
          ) : null}

          {decision.timers.length > 0 ? (
            <ul className="timer-list">
              {decision.timers.map((timer) => (
                <li key={timer.id}>
                  <span>{timer.label}</span>
                  <span className="small-print">{Math.round(timer.durationMs / 1000)}s</span>
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      ) : (
        <p>No events available. Add more content packs to keep the campaign fresh.</p>
      )}

      <section className="card">
        <h3>Player telemetry</h3>
        <div className="telemetry-grid">
          <div>
            <h4>Mastery</h4>
            <ul>
              {Object.entries(masteryByTopic).map(([topic, score]) => (
                <li key={topic}>
                  {topic}
                  <span className="small-print"> {(score * 100).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Meters</h4>
            <ul>
              {Object.entries(meterStates).map(([meter, value]) => (
                <li key={meter}>
                  {meter}
                  <span className="small-print"> {value}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Recent mistakes</h4>
            <ul>
              {recentMistakes.length > 0 ? (
                recentMistakes.map((mistake, index) => (
                  <li key={`${typeof mistake === 'string' ? mistake : mistake.topic}-${index}`}>
                    {typeof mistake === 'string' ? mistake : mistake.topic}
                  </li>
                ))
              ) : (
                <li>None tracked</li>
              )}
            </ul>
          </div>
        </div>
      </section>

      {debugSnapshot?.enabled ? <DirectorDebugOverlay snapshot={debugSnapshot} /> : null}
    </section>
  )
}

export default RunPage
