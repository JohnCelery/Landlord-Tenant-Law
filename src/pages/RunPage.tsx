import { type JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import DirectorDebugOverlay from '../components/DirectorDebugOverlay'
import {
  createDirector,
  type DirectorDecision,
  type DirectorDebugSnapshot,
  type DirectorEvent,
  type DirectorMistake,
} from '../core/director'
import { defaultMeters, type MeterSnapshot, type OutcomeDelta } from '../core/scoring'
import { useActivePack } from '../data/packs'
import {
  applyModifiersToOutcome,
  campaignBuildings,
  collectModifierNotes,
  filterEventsForActiveModifiers,
  resolveBuildingTopics,
  useCampaignState,
} from '../core/campaign'
import EventCaseFile, {
  type CaseResolution,
  type SessionEventInput,
} from './components/EventCaseFile'
import type { SessionEvent } from '../data/packs/schema'
import { type MasteryRecord, toGameMeters, useGameState } from '../core/gameState'

const clamp = (value: number, min = 0, max = 1): number => {
  return Math.min(max, Math.max(min, value))
}

const RunPage = (): JSX.Element => {
  const pack = useActivePack()
  const { selectedBuildingId, activeModifiers } = useCampaignState()
  const navigate = useNavigate()
  const seedInitializedRef = useRef(false)
  const {
    runId,
    runSeed,
    startRun,
    setDayInStore,
    setXpInStore,
    setMetersInStore,
    setMasteryInStore,
    setStreakInStore,
    setCoinsInStore,
    adjustCoinsInStore,
    incrementHintsUsedInStore,
  } = useGameState((state) => ({
    runId: state.runId,
    runSeed: state.runSeed,
    startRun: state.startRun,
    setDayInStore: state.setDay,
    setXpInStore: state.setXp,
    setMetersInStore: state.setMeters,
    setMasteryInStore: state.setMastery,
    setStreakInStore: state.setStreakDays,
    setCoinsInStore: state.setCoins,
    adjustCoinsInStore: state.adjustCoins,
    incrementHintsUsedInStore: state.incrementHintsUsed,
  }))

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
  const [sessionLog, setSessionLog] = useState<SessionEvent[]>([])
  const [pendingCleanupEvents, setPendingCleanupEvents] = useState<DirectorEvent[]>([])
  const [scheduledCleanupEvents, setScheduledCleanupEvents] = useState<DirectorEvent[]>([])
  const [streak, setStreak] = useState(0)
  const [xpTotal, setXpTotal] = useState(0)
  const [xpMultiplier, setXpMultiplier] = useState(1)
  const [lastCombo, setLastCombo] = useState<string | null>(null)
  const [unlockedSkillIds, setUnlockedSkillIds] = useState<string[]>([])
  const [pendingOutcome, setPendingOutcome] = useState<OutcomeDelta | null>(null)
  const [, setResolutionHistory] = useState<
    Array<{ id: string; topic: string; resolvedAt: number; correct: boolean }>
  >([])
  const sessionCounterRef = useRef(0)

  const convertRatiosToMastery = useCallback((ratios: Record<string, number>): MasteryRecord => {
    return Object.entries(ratios).reduce<MasteryRecord>((acc, [topic, value]) => {
      const normalized = clamp(value, 0, 1)
      const right = Math.max(0, Math.round(normalized * 100))
      const wrong = Math.max(0, 100 - right)
      acc[topic] = { right, wrong }
      return acc
    }, {})
  }, [])

  const mapMetersForStore = useCallback((meters: Record<string, number>) => {
    return toGameMeters({
      compliance: meters.compliance ?? 0,
      residentTrust: meters.residentTrust ?? meters.trust ?? 0,
      ownerROI: meters.ownerROI ?? meters.roi ?? 0,
      risk: meters.risk ?? 0,
    })
  }, [])

  const ensureNumber = useCallback((value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }

    return null
  }, [])

  useEffect(() => {
    if (seedInitializedRef.current) {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    seedInitializedRef.current = true
    const params = new URLSearchParams(window.location.search)
    const seedParam = params.get('seed')
    const parsedSeed = seedParam ? Number.parseInt(seedParam, 10) : Number.NaN
    const hasExistingRun = Boolean(runId)
    let activeSeed = runSeed

    if (Number.isFinite(parsedSeed) && parsedSeed > 0) {
      if (!hasExistingRun || parsedSeed !== runSeed) {
        activeSeed = startRun(parsedSeed)
      } else {
        activeSeed = parsedSeed
      }
    } else if (!hasExistingRun) {
      activeSeed = startRun()
    } else if (!runSeed) {
      activeSeed = startRun()
    }

    if (!Number.isFinite(parsedSeed) || parsedSeed !== activeSeed) {
      params.set('seed', String(activeSeed))
      navigate({ pathname: window.location.pathname, search: params.toString() }, { replace: true })
    }
  }, [navigate, runId, runSeed, startRun])

  useEffect(() => {
    if (!seedInitializedRef.current) {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    if (!runSeed) {
      return
    }

    const params = new URLSearchParams(window.location.search)
    const current = params.get('seed')

    if (current === String(runSeed)) {
      return
    }

    params.set('seed', String(runSeed))
    navigate({ pathname: window.location.pathname, search: params.toString() }, { replace: true })
  }, [navigate, runSeed])

  useEffect(() => {
    const baselineMastery = pack.topics.reduce<Record<string, number>>((acc, topic, index) => {
      const baseline = clamp(0.8 - index * 0.1)
      acc[topic] = Number(baseline.toFixed(2))
      return acc
    }, {})

    setDay(1)
    setMasteryByTopic(baselineMastery)
    setMeterStates(() => ({ ...defaultMeters }))
    setRecentMistakes(() =>
      pack.topics.slice(0, 2).map((topic, index) => ({
        topic,
        timestamp: new Date(Date.now() - index * 45 * 60 * 1000).toISOString(),
      })),
    )
    setSessionLog(pack.sessionEvents ?? [])
    setPendingCleanupEvents([])
    setScheduledCleanupEvents([])
    setStreak(0)
    setXpTotal(0)
    setXpMultiplier(1)
    setLastCombo(null)
    setResolutionHistory([])
    const baselineSkills = pack.skills.length > 0 ? [pack.skills[0].id] : []
    setUnlockedSkillIds(baselineSkills)
    setPendingOutcome(null)

    setDayInStore(1)
    setXpInStore(0)
    setStreakInStore(0)
    setCoinsInStore(5)
    setMetersInStore(toGameMeters(defaultMeters))
    setMasteryInStore(convertRatiosToMastery(baselineMastery))
  }, [
    pack,
    selectedBuilding.id,
    convertRatiosToMastery,
    setCoinsInStore,
    setDayInStore,
    setMasteryInStore,
    setMetersInStore,
    setStreakInStore,
    setXpInStore,
  ])

  useEffect(() => {
    setDayInStore(day)
  }, [day, setDayInStore])

  useEffect(() => {
    setXpInStore(xpTotal)
  }, [setXpInStore, xpTotal])

  useEffect(() => {
    setStreakInStore(streak)
  }, [setStreakInStore, streak])

  useEffect(() => {
    if (Object.keys(meterStates).length === 0) {
      return
    }

    setMetersInStore(mapMetersForStore(meterStates))
  }, [mapMetersForStore, meterStates, setMetersInStore])

  useEffect(() => {
    if (Object.keys(masteryByTopic).length === 0) {
      return
    }

    setMasteryInStore(convertRatiosToMastery(masteryByTopic))
  }, [convertRatiosToMastery, masteryByTopic, setMasteryInStore])

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

  const activeEvent = useMemo(() => {
    if (pendingCleanupEvents.length > 0) {
      return pendingCleanupEvents[0]
    }

    return decision?.event ?? null
  }, [decision, pendingCleanupEvents])

  const activeEventId = activeEvent?.id ?? null

  useEffect(() => {
    if (!activeEventId) {
      return
    }

    setCoinsInStore(5)
  }, [activeEventId, setCoinsInStore])

  const relatedQuestion = useMemo(() => {
    if (!activeEvent?.relatedQuestionId) {
      return null
    }

    return pack.questions.find((question) => question.id === activeEvent.relatedQuestionId) ?? null
  }, [activeEvent, pack.questions])

  const adjustedOutcome = useMemo(() => {
    if (!activeEvent?.meterImpact) {
      return null
    }

    if (pendingCleanupEvents.length > 0) {
      return activeEvent.meterImpact
    }

    return applyModifiersToOutcome(activeEvent, activeEvent.meterImpact, activeModifiers)
  }, [activeEvent, activeModifiers, pendingCleanupEvents.length])

  const combinedModifiers = useMemo(() => {
    if (!decision || pendingCleanupEvents.length > 0) {
      return modifierNotes
    }

    return [...decision.modifiers, ...modifierNotes]
  }, [decision, modifierNotes, pendingCleanupEvents.length])

  useEffect(() => {
    if (debugSnapshot?.enabled) {
      setDebugSnapshot(director.debug('peek'))
    }
  }, [director, decision, debugSnapshot?.enabled])

  const handleAdvanceDay = useCallback(() => {
    setDay((current) => current + 1)

    setMeterStates((current) => {
      const outcomeToApply = pendingOutcome ?? adjustedOutcome

      if (!outcomeToApply) {
        return current
      }

      const next = { ...current }

      for (const [meter, impact] of Object.entries(outcomeToApply)) {
        if (meter === 'summary' || typeof impact !== 'number') {
          continue
        }

        const baseline =
          current[meter] ?? (defaultMeters as MeterSnapshot)[meter as keyof MeterSnapshot] ?? 60
        next[meter] = Math.max(0, Math.min(100, Math.round(baseline + impact * 2)))
      }

      return next
    })

    setPendingOutcome(null)

    if (scheduledCleanupEvents.length > 0) {
      setPendingCleanupEvents((current) => [...current, ...scheduledCleanupEvents])
      setScheduledCleanupEvents([])
    }
  }, [adjustedOutcome, pendingOutcome, scheduledCleanupEvents])

  const handleToggleDebug = useCallback(() => {
    const snapshot = director.debug()
    setDebugSnapshot(snapshot.enabled ? snapshot : null)
  }, [director])

  const emitSessionEvent = useCallback(
    (input: SessionEventInput) => {
      const data = input.data as Record<string, unknown> | undefined

      if (input.kind === 'case_hint_purchase') {
        const coinsRemaining = ensureNumber(data?.['coinsRemaining'])

        if (coinsRemaining !== null) {
          setCoinsInStore(coinsRemaining)
        }
      } else if (input.kind === 'case_action') {
        const cost = ensureNumber(data?.['coinCost'])

        if (cost !== null) {
          adjustCoinsInStore(-cost)
        }
      } else if (input.kind === 'case_hint_reveal') {
        incrementHintsUsedInStore()
      }

      sessionCounterRef.current += 1
      const entry: SessionEvent = {
        id: `${input.kind}-${Date.now()}-${sessionCounterRef.current}`,
        kind: input.kind,
        timestamp: new Date().toISOString(),
        summary: input.summary,
        data: input.data,
      }

      setSessionLog((current) => [...current.slice(-49), entry])
    },
    [adjustCoinsInStore, ensureNumber, incrementHintsUsedInStore, setCoinsInStore],
  )

  useEffect(() => {
    if (pack.skills.length === 0) {
      return
    }

    const newlyUnlocked: string[] = []

    setUnlockedSkillIds((current) => {
      const next = new Set(current)

      pack.skills.forEach((skill, index) => {
        const threshold = index === 0 ? 0 : 400 * index

        if (xpTotal >= threshold && !next.has(skill.id)) {
          next.add(skill.id)
          newlyUnlocked.push(skill.id)
        }
      })

      if (newlyUnlocked.length === 0) {
        return current
      }

      return Array.from(next)
    })

    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach((skillId) => {
        const skill = pack.skills.find((entry) => entry.id === skillId)
        emitSessionEvent({
          kind: 'skill_unlocked',
          summary: `Unlocked ${skill?.name ?? skillId}`,
          data: {
            skillId,
          },
        })
      })
    }
  }, [emitSessionEvent, pack.skills, xpTotal])

  const detectLinkedCombo = useCallback(
    (history: Array<{ topic: string; resolvedAt: number; correct: boolean }>): boolean => {
      const windowed = history
        .filter((entry) => entry.correct)
        .sort((a, b) => a.resolvedAt - b.resolvedAt)

      const sequence = ['cease', 'quit', 'service']
      let index = 0
      let firstTimestamp: number | null = null

      for (const entry of windowed) {
        const normalized = entry.topic.toLowerCase()

        if (normalized.includes(sequence[index])) {
          if (index === 0) {
            firstTimestamp = entry.resolvedAt
          }

          index += 1

          if (index === sequence.length) {
            if (firstTimestamp && entry.resolvedAt - firstTimestamp <= 1000 * 60 * 60 * 48) {
              return true
            }

            index = 1
            firstTimestamp = entry.resolvedAt
          }
        }
      }

      return false
    },
    [],
  )

  const handleCaseResolved = useCallback(
    (resolution: CaseResolution) => {
      if (!activeEvent) {
        return
      }

      if (pendingCleanupEvents.length > 0 && pendingCleanupEvents[0].id === activeEvent.id) {
        setPendingCleanupEvents((current) => current.slice(1))
      }

      const appliedOutcome = resolution.meterImpact ?? adjustedOutcome ?? null
      setPendingOutcome(appliedOutcome)

      const previousMastery = masteryByTopic[activeEvent.topic] ?? 0.5
      const masteryDelta = resolution.correct ? 0.08 : -0.06
      const nextMastery = Number(clamp(previousMastery + masteryDelta).toFixed(2))

      setMasteryByTopic((current) => ({
        ...current,
        [activeEvent.topic]: nextMastery,
      }))

      emitSessionEvent({
        kind: 'topic_mastery',
        summary: `Mastery for ${activeEvent.topic} ${(nextMastery * 100).toFixed(0)}%`,
        data: {
          topic: activeEvent.topic,
          previous: previousMastery,
          next: nextMastery,
          correct: resolution.correct,
        },
      })

      const now = Date.now()
      const windowStart = now - 1000 * 60 * 60 * 48
      let nextStreak = 0

      setStreak((current) => {
        nextStreak = resolution.correct ? current + 1 : 0
        return nextStreak
      })

      let linkedComboTriggered = false

      setResolutionHistory((current) => {
        const next = [
          ...current.filter((entry) => entry.resolvedAt >= windowStart),
          {
            id: activeEvent.id,
            topic: activeEvent.topic,
            resolvedAt: now,
            correct: resolution.correct,
          },
        ]
        linkedComboTriggered = detectLinkedCombo(next)
        return next
      })

      const baseXp = resolution.correct ? 120 : 40
      let multiplier = 1

      if (resolution.correct) {
        if (nextStreak >= 5) {
          multiplier += 0.5
        } else if (nextStreak >= 3) {
          multiplier += 0.25
        }
      }

      if (linkedComboTriggered) {
        multiplier *= 2
        setLastCombo('Cease → Quit → Service combo!')
      } else if (!resolution.correct) {
        setLastCombo(null)
      }

      setXpMultiplier(multiplier)
      setXpTotal((current) => current + Math.round(baseXp * multiplier))

      if (!resolution.correct) {
        setRecentMistakes((current) => {
          const entry: DirectorMistake = {
            topic: activeEvent.topic,
            eventId: activeEvent.id,
            timestamp: new Date().toISOString(),
          }

          return [...current.slice(-4), entry]
        })

        const cleanupEvent: DirectorEvent = {
          id: `cleanup-${activeEvent.id}-${now}`,
          topic: activeEvent.topic,
          pressure: Math.max(1, activeEvent.pressure),
          description: `Cleanup required after the response to ${activeEvent.id}.`,
          meterImpact: {
            summary: `Follow-up tasks triggered by mistakes on ${activeEvent.id}.`,
            risk: 2,
            compliance: -2,
          },
          citation: activeEvent.citation,
          relatedQuestionId: activeEvent.relatedQuestionId,
        }

        setScheduledCleanupEvents((current) => [...current, cleanupEvent])
      }
    },
    [
      activeEvent,
      adjustedOutcome,
      detectLinkedCombo,
      emitSessionEvent,
      masteryByTopic,
      pendingCleanupEvents,
    ],
  )

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

      {activeEvent ? (
        <EventCaseFile
          key={activeEvent.id}
          event={activeEvent}
          relatedQuestion={relatedQuestion ?? undefined}
          baseTimeMs={decision?.timers[0]?.durationMs ?? 90000}
          coinsAvailable={5}
          onResolve={handleCaseResolved}
          onSessionEvent={emitSessionEvent}
          isCleanup={
            pendingCleanupEvents.length > 0 && pendingCleanupEvents[0].id === activeEvent.id
          }
          modifiers={combinedModifiers}
          outcomeSummary={adjustedOutcome?.summary}
          modeLabel={
            decision ? `Mode ${decision.mode} · Target ${decision.intendedMode}` : undefined
          }
          unlockedSkillIds={unlockedSkillIds}
        />
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
          <div>
            <h4>Run momentum</h4>
            <ul>
              <li>
                XP total
                <span className="small-print"> {xpTotal}</span>
              </li>
              <li>
                Current streak
                <span className="small-print"> {streak}</span>
              </li>
              <li>
                Multiplier
                <span className="small-print"> ×{xpMultiplier.toFixed(2)}</span>
              </li>
              <li>
                Combo
                <span className="small-print"> {lastCombo ?? 'None'}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="card session-log">
        <h3>Session events</h3>
        <ul>
          {sessionLog.length > 0 ? (
            [...sessionLog].reverse().map((entry) => (
              <li key={entry.id}>
                <strong>{entry.kind}</strong>
                <span className="small-print">
                  {' '}
                  · {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <p>{entry.summary}</p>
              </li>
            ))
          ) : (
            <li>No session events yet.</li>
          )}
        </ul>
      </section>

      {debugSnapshot?.enabled ? <DirectorDebugOverlay snapshot={debugSnapshot} /> : null}
    </section>
  )
}

export default RunPage
