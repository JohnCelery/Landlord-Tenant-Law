import { type JSX, useEffect, useMemo, useRef, useState } from 'react'

import type { DirectorEvent } from '../../core/director'
import type { OutcomeDelta } from '../../core/scoring'
import type { Question } from '../../data/packs/schema'
import { formatDuration } from '../../utils/timers'

export interface CaseResolution {
  questionId: string | null
  choiceId: string
  correct: boolean
  wasLate: boolean
  timeSpentMs: number
  starsEarned: number
  actionIds: string[]
  revealedFactIds: string[]
  hintUsed: boolean
  meterImpact?: OutcomeDelta
  rationale?: string
}

export interface SessionEventInput {
  kind: string
  summary: string
  data?: Record<string, unknown>
}

interface CaseActionConfig {
  id: string
  label: string
  description: string
  timeCostMs: number
  coinCost: number
  factId: string
}

interface CaseFact {
  id: string
  title: string
  body: string
  hidden: boolean
}

interface EventCaseFileProps {
  event: DirectorEvent
  relatedQuestion?: Question
  baseTimeMs: number
  coinsAvailable: number
  onResolve: (resolution: CaseResolution) => void
  onSessionEvent: (input: SessionEventInput) => void
  isCleanup?: boolean
  modifiers: readonly string[]
  outcomeSummary?: string
  modeLabel?: string
  unlockedSkillIds: readonly string[]
}

const ACTION_LIBRARY: CaseActionConfig[] = [
  {
    id: 'peek-lease',
    label: 'Peek lease',
    description: 'Review the lease clauses tied to this dispute.',
    timeCostMs: 15000,
    coinCost: 1,
    factId: 'fact-lease',
  },
  {
    id: 'peek-ledger',
    label: 'Pull ledger',
    description: 'Check payment history and fees for mismatches.',
    timeCostMs: 20000,
    coinCost: 1,
    factId: 'fact-ledger',
  },
  {
    id: 'peek-policies',
    label: 'Policy binder',
    description: 'Confirm internal SOP alignment and training notes.',
    timeCostMs: 12000,
    coinCost: 1,
    factId: 'fact-policy',
  },
  {
    id: 'rc-checker',
    label: 'RC checker',
    description: 'Run the reasonable cause checker for NJLAD impacts.',
    timeCostMs: 18000,
    coinCost: 2,
    factId: 'fact-rc',
  },
  {
    id: 'call-pha',
    label: 'Call PHA',
    description: 'Get guidance from the public housing authority.',
    timeCostMs: 25000,
    coinCost: 2,
    factId: 'fact-pha',
  },
]

const createFacts = (event: DirectorEvent, question?: Question): CaseFact[] => {
  const baseFacts: CaseFact[] = [
    {
      id: 'fact-brief',
      title: 'Brief',
      body: event.description,
      hidden: false,
    },
    {
      id: 'fact-lease',
      title: 'Lease excerpt',
      body: `Lease references for ${event.topic} show addenda requiring documentation before enforcement.`,
      hidden: true,
    },
    {
      id: 'fact-ledger',
      title: 'Ledger snapshot',
      body: 'Ledger review highlights the last three resident contacts tied to this event.',
      hidden: true,
    },
    {
      id: 'fact-policy',
      title: 'Policy notes',
      body: 'Policy binder reminder: log communications and attach service proof within 24 hours.',
      hidden: true,
    },
    {
      id: 'fact-rc',
      title: 'Reasonable cause checker',
      body: 'RC checker flags potential accommodation obligations if timelines slip.',
      hidden: true,
    },
    {
      id: 'fact-pha',
      title: 'PHA guidance',
      body: 'PHA call records stress collaboration and making residents whole before escalation.',
      hidden: true,
    },
  ]

  if (event.citation) {
    baseFacts.push({
      id: 'fact-citation',
      title: 'Citation',
      body: event.citation,
      hidden: false,
    })
  }

  if (question?.explanation) {
    baseFacts.push({
      id: 'fact-explanation',
      title: 'Teaching note',
      body: question.explanation,
      hidden: true,
    })
  }

  return baseFacts
}

const FALLBACK_CHOICES: Question['choices'] = [
  {
    id: 'fallback-resolve',
    label: 'Send notice to cease and outline remediation steps',
    correct: true,
  },
  {
    id: 'fallback-consult',
    label: 'Call PHA before escalating enforcement',
    correct: false,
  },
  {
    id: 'fallback-delay',
    label: 'Decline ES animal fee and wait for the court date',
    correct: false,
  },
]

const HINT_TOKEN_BASE_COST = 2
const TOOLTIP_SKILL_ID = 'policy-tracker'
const RAPID_REPLY_SKILL_ID = 'rapid-reply'

const resolveStars = (timeRemaining: number, baseTimeMs: number, wasLate: boolean): number => {
  if (wasLate) {
    return 1
  }

  const ratio = timeRemaining / baseTimeMs

  if (ratio >= 0.5) {
    return 3
  }

  if (ratio >= 0.25) {
    return 2
  }

  return 1
}

const EventCaseFile = ({
  event,
  relatedQuestion,
  baseTimeMs,
  coinsAvailable,
  onResolve,
  onSessionEvent,
  isCleanup = false,
  modifiers,
  outcomeSummary,
  modeLabel,
  unlockedSkillIds,
}: EventCaseFileProps): JSX.Element => {
  const [coins, setCoins] = useState(coinsAvailable)
  const [timeRemaining, setTimeRemaining] = useState(baseTimeMs)
  const [actionsTaken, setActionsTaken] = useState<string[]>([])
  const [revealedFacts, setRevealedFacts] = useState<Set<string>>(new Set())
  const [isResolved, setIsResolved] = useState(false)
  const [hintTokens, setHintTokens] = useState(0)
  const [hintRevealed, setHintRevealed] = useState(false)
  const [lastAnswer, setLastAnswer] = useState<{
    choiceId: string
    correct: boolean
    meterImpact?: OutcomeDelta
    rationale: string
  } | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const timerRef = useRef<number | null>(null)

  const facts = useMemo(() => createFacts(event, relatedQuestion), [event, relatedQuestion])

  const hintCost = useMemo(() => {
    if (unlockedSkillIds.includes(RAPID_REPLY_SKILL_ID)) {
      return Math.max(1, HINT_TOKEN_BASE_COST - 1)
    }

    return HINT_TOKEN_BASE_COST
  }, [unlockedSkillIds])

  const hintPreview = useMemo(() => {
    if (!relatedQuestion?.explanation) {
      return 'Check the case file for service proof and statutory timing.'
    }

    const sentences = relatedQuestion.explanation.split(/(?<=[.!?])\s+/)
    return sentences[0] ?? relatedQuestion.explanation
  }, [relatedQuestion])

  const tooltipsEnabled = useMemo(() => {
    return unlockedSkillIds.includes(TOOLTIP_SKILL_ID)
  }, [unlockedSkillIds])

  useEffect(() => {
    setCoins(coinsAvailable)
    setTimeRemaining(baseTimeMs)
    setActionsTaken([])
    setRevealedFacts(new Set())
    setIsResolved(false)
    setHintTokens(0)
    setHintRevealed(false)
    setLastAnswer(null)
    startTimeRef.current = Date.now()

    if (timerRef.current) {
      window.clearInterval(timerRef.current)
    }

    timerRef.current = window.setInterval(() => {
      setTimeRemaining((current) => Math.max(0, current - 1000))
    }, 1000)

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
      }
    }
  }, [baseTimeMs, coinsAvailable, event.id])

  useEffect(() => {
    if (timeRemaining <= 0 && timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [timeRemaining])

  const handleAction = (action: CaseActionConfig) => {
    if (isResolved) {
      return
    }

    if (actionsTaken.includes(action.id)) {
      return
    }

    if (coins < action.coinCost || timeRemaining <= 0 || timeRemaining < action.timeCostMs) {
      return
    }

    setCoins((current) => current - action.coinCost)
    setActionsTaken((current) => [...current, action.id])
    setTimeRemaining((current) => Math.max(0, current - action.timeCostMs))

    setRevealedFacts((current) => {
      const next = new Set(current)
      next.add(action.factId)
      return next
    })

    onSessionEvent({
      kind: 'case_action',
      summary: `${action.label} on ${event.id}`,
      data: {
        actionId: action.id,
        coinCost: action.coinCost,
        timeCostMs: action.timeCostMs,
      },
    })
  }

  const choices = useMemo(() => {
    if (relatedQuestion) {
      return relatedQuestion.choices
    }

    return FALLBACK_CHOICES
  }, [relatedQuestion])

  const handleBuyHint = () => {
    if (isResolved) {
      return
    }

    if (hintTokens > 0) {
      return
    }

    if (coins < hintCost) {
      return
    }

    const remaining = coins - hintCost
    setCoins(remaining)
    setHintTokens(1)

    onSessionEvent({
      kind: 'case_hint_purchase',
      summary: `Bought hint for ${event.id}`,
      data: {
        eventId: event.id,
        cost: hintCost,
        coinsRemaining: remaining,
      },
    })
  }

  const handleRevealHint = () => {
    if (isResolved) {
      return
    }

    if (hintTokens <= 0 || hintRevealed) {
      return
    }

    setHintTokens(0)
    setHintRevealed(true)

    onSessionEvent({
      kind: 'case_hint_reveal',
      summary: `Revealed hint for ${event.id}`,
      data: {
        eventId: event.id,
        source: relatedQuestion?.id ?? null,
      },
    })
  }

  const handleChoice = (choiceId: string) => {
    if (isResolved) {
      return
    }

    const choice = choices.find((entry) => entry.id === choiceId)

    if (!choice) {
      return
    }

    setIsResolved(true)

    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }

    const elapsed = Date.now() - startTimeRef.current
    const wasLate = elapsed > baseTimeMs
    const starsEarned = resolveStars(timeRemaining, baseTimeMs, wasLate)
    const revealedFactIds = Array.from(revealedFacts)
    const meterImpact = choice.meterImpact ?? event.meterImpact
    const rationale =
      choice.meterImpact?.summary ??
      relatedQuestion?.explanation ??
      event.meterImpact?.summary ??
      'Review statutory requirements to stay compliant.'

    setLastAnswer({
      choiceId,
      correct: Boolean(choice.correct),
      meterImpact: meterImpact ?? undefined,
      rationale,
    })

    onSessionEvent({
      kind: 'case_answer',
      summary: `Answered ${event.id} with ${choiceId}`,
      data: {
        choiceId,
        wasLate,
        starsEarned,
        actionsTaken,
        hintUsed: hintRevealed,
        meterImpact,
      },
    })

    onResolve({
      questionId: relatedQuestion?.id ?? null,
      choiceId,
      correct: Boolean(choice.correct),
      wasLate,
      timeSpentMs: elapsed,
      starsEarned,
      actionIds: actionsTaken,
      revealedFactIds,
      hintUsed: hintRevealed,
      meterImpact: meterImpact ?? undefined,
      rationale,
    })
  }

  const meterEntries = useMemo(() => {
    if (!lastAnswer?.meterImpact) {
      return []
    }

    return Object.entries(lastAnswer.meterImpact).filter((entry): entry is [string, number] => {
      const [key, value] = entry
      return key !== 'summary' && typeof value === 'number' && Number.isFinite(value)
    })
  }, [lastAnswer])

  return (
    <article className="card case-file">
      <header className="case-file__header">
        <div>
          <h3>{event.topic}</h3>
          <p className="badge">Pressure {event.pressure}</p>
        </div>
        <div className="case-file__meta">
          <span className="case-file__timer" aria-live="polite">
            ⏱ {formatDuration(timeRemaining)}
          </span>
          <span className="case-file__coins">🪙 {coins}</span>
          <span className="case-file__stars" aria-live="polite">
            ⭐ {resolveStars(timeRemaining, baseTimeMs, timeRemaining <= 0)}
          </span>
          <span className="case-file__tokens" aria-live="polite">
            🎟 {hintTokens}
          </span>
        </div>
      </header>

      <p className="case-file__description">{event.description}</p>
      <p className="small-print">
        {modeLabel ? `${modeLabel} · ` : ''}
        {isCleanup ? 'Cleanup follow-up' : 'Live case'} · Timer {formatDuration(baseTimeMs)}
        {event.citation ? ` · Source: ${event.citation}` : ''}
      </p>

      {outcomeSummary ? <p className="small-print">Forecast: {outcomeSummary}</p> : null}

      {modifiers.length > 0 ? (
        <ul className="modifier-list case-file__modifiers">
          {modifiers.map((modifier) => (
            <li key={modifier}>{modifier}</li>
          ))}
        </ul>
      ) : null}

      <section aria-label="Case actions" className="case-file__actions">
        <h4>Investigative actions</h4>
        <ul>
          {ACTION_LIBRARY.map((action) => {
            const disabled =
              isResolved ||
              actionsTaken.includes(action.id) ||
              coins < action.coinCost ||
              timeRemaining <= 0

            return (
              <li key={action.id}>
                <button type="button" onClick={() => handleAction(action)} disabled={disabled}>
                  {action.label}
                  <span className="small-print">
                    −{action.coinCost}🪙 · −{Math.round(action.timeCostMs / 1000)}s
                  </span>
                </button>
                <p className="small-print">{action.description}</p>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-label="Case file" className="case-file__facts">
        <h4>Case file</h4>
        <ul>
          {facts.map((fact) => {
            const revealed = !fact.hidden || revealedFacts.has(fact.id)
            return (
              <li key={fact.id} className={revealed ? 'revealed' : 'hidden'}>
                <strong>{fact.title}</strong>
                <p>{revealed ? fact.body : 'Hidden — spend actions to reveal.'}</p>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-label="Resolve case" className="case-file__response">
        <h4>{relatedQuestion ? 'How do you resolve it?' : 'Choose a response'}</h4>
        <div className="hint-controls">
          <button
            type="button"
            onClick={handleBuyHint}
            disabled={isResolved || coins < hintCost || hintTokens > 0}
          >
            Buy hint (−{hintCost}🪙)
          </button>
          <button
            type="button"
            className="secondary"
            onClick={handleRevealHint}
            disabled={isResolved || hintTokens <= 0 || hintRevealed}
          >
            Reveal hint token
          </button>
        </div>
        {hintRevealed ? <p className="case-file__hint">Hint: {hintPreview}</p> : null}
        <ul>
          {choices.map((choice) => (
            <li key={choice.id}>
              <button
                type="button"
                className="secondary"
                onClick={() => handleChoice(choice.id)}
                disabled={isResolved}
                title={
                  tooltipsEnabled && choice.meterImpact?.summary
                    ? choice.meterImpact.summary
                    : undefined
                }
              >
                {choice.label}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {lastAnswer ? (
        <section aria-label="Outcome" className="case-file__outcome">
          <h4>Decision outcome</h4>
          {meterEntries.length > 0 ? (
            <ul className="case-file__meter-deltas">
              {meterEntries.map(([meter, impact]) => {
                const display = Math.round(impact * 2)
                const sign = display >= 0 ? '+' : ''
                return (
                  <li key={meter}>
                    <strong>
                      {sign}
                      {display}
                    </strong>
                    <span>{meter}</span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="small-print">No meter changes recorded for this option.</p>
          )}
          <p>{lastAnswer.rationale}</p>
          <details>
            <summary>Show me the law</summary>
            {event.citation ? (
              <p>
                <a href={event.citation} target="_blank" rel="noreferrer">
                  Open citation
                </a>
              </p>
            ) : (
              <p className="small-print">No citations provided for this scenario.</p>
            )}
          </details>
        </section>
      ) : null}
    </article>
  )
}

export default EventCaseFile
