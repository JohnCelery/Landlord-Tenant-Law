import { chooseWeighted, createRNGController, type RNG, type WeightedItem } from '../rng'
import type { MeterSnapshot, OutcomeDelta } from '../scoring'

export type DirectorDifficulty = 'easy' | 'normal' | 'hard'
export type DirectorMode = 'application' | 'recall' | 'boss_setup'

export interface DirectorDifficultyCurve {
  start: DirectorDifficulty
  mid: DirectorDifficulty
  late: DirectorDifficulty
}

export type DirectorMistake =
  | string
  | {
      topic: string
      timestamp?: string | number
      eventId?: string
    }

export type DirectorMeterState = Partial<MeterSnapshot> & Record<string, number | undefined>

export interface DirectorEvent {
  id: string
  topic: string
  pressure: number
  description: string
  meterImpact?: OutcomeDelta
  citation?: string
  relatedQuestionId?: string
}

export interface DirectorTimer {
  id: string
  label: string
  durationMs: number
}

export interface DirectorPlanInput {
  day: number
  masteryByTopic: Record<string, number>
  recentMistakes: readonly DirectorMistake[]
  meterStates: DirectorMeterState
  difficultyCurve?: DirectorDifficultyCurve
}

export interface DirectorDecision {
  event: DirectorEvent | null
  day: number
  difficulty: DirectorDifficulty
  mode: DirectorMode
  intendedMode: DirectorMode
  modifiers: string[]
  timers: DirectorTimer[]
}

export interface DirectorWeightBreakdown {
  mastery: number
  mistakes: number
  meters: number
  difficulty: number
  mode: number
  randomness: number
}

export interface DirectorDebugCandidateSnapshot {
  eventId: string
  topic: string
  mode: DirectorMode
  weight: number
  breakdown: DirectorWeightBreakdown
}

export interface DirectorPlanContextSnapshot extends DirectorPlanInput {
  difficultyCurve: DirectorDifficultyCurve
}

export interface DirectorDistributionSnapshot {
  target: Record<DirectorMode, number>
  actual: Record<DirectorMode, number>
  deficits: Record<DirectorMode, number>
}

export interface DirectorDebugSnapshot {
  enabled: boolean
  counts: Record<DirectorMode, number>
  distribution: DirectorDistributionSnapshot
  lastDecision: DirectorDecision | null
  lastContext: DirectorPlanContextSnapshot | null
  intendedMode: DirectorMode | null
  candidates: DirectorDebugCandidateSnapshot[]
}

export interface DirectorRuntimeState {
  counts: Record<DirectorMode, number>
  lastEventId: string | null
  lastDecision: DirectorDecision | null
  lastContext: DirectorPlanContextSnapshot | null
  intendedMode: DirectorMode | null
  debugEnabled: boolean
  candidates: DirectorCandidateInsight[]
}

export interface DirectorConfig {
  events: readonly DirectorEvent[]
  difficultyCurve: DirectorDifficultyCurve
  seed?: number
}

export type DirectorDebugAction = 'toggle' | 'peek'

export interface DirectorService {
  planNext: (input: DirectorPlanInput) => DirectorDecision
  debug: (action?: DirectorDebugAction) => DirectorDebugSnapshot
  getState: () => DirectorRuntimeState
}

interface DirectorCandidateInsight {
  event: DirectorEvent
  weight: number
  mode: DirectorMode
  breakdown: DirectorWeightBreakdown
}

const TARGET_DISTRIBUTION: Record<DirectorMode, number> = {
  application: 0.7,
  recall: 0.2,
  boss_setup: 0.1,
}

const DIFFICULTY_PRESSURE_TARGET: Record<DirectorDifficulty, number> = {
  easy: 1.5,
  normal: 2.8,
  hard: 4.2,
}

const BASE_WEIGHT = 0.6
const MIN_WEIGHT = 0.01

const determinePhase = (day: number): keyof DirectorDifficultyCurve => {
  if (day <= 3) return 'start'
  if (day <= 7) return 'mid'
  return 'late'
}

const resolveDifficulty = (curve: DirectorDifficultyCurve, day: number): DirectorDifficulty => {
  return curve[determinePhase(day)]
}

const normalizeMastery = (value: number | undefined): number => {
  if (value === undefined) {
    return 0.5
  }

  if (Number.isNaN(value)) {
    return 0.5
  }

  if (value > 1) {
    return Math.max(0, Math.min(1, value / 100))
  }

  return Math.max(0, Math.min(1, value))
}

const normalizeMistake = (entry: DirectorMistake): { topic: string } | null => {
  if (typeof entry === 'string') {
    return entry ? { topic: entry } : null
  }

  if (entry && entry.topic) {
    return { topic: entry.topic }
  }

  return null
}

const countMistakes = (mistakes: readonly DirectorMistake[]): Record<string, number> => {
  return mistakes.reduce<Record<string, number>>((acc, raw) => {
    const normalized = normalizeMistake(raw)

    if (!normalized) {
      return acc
    }

    acc[normalized.topic] = (acc[normalized.topic] ?? 0) + 1
    return acc
  }, {})
}

const evaluateMeterAlignment = (event: DirectorEvent, meterStates: DirectorMeterState): number => {
  if (!event.meterImpact) {
    return 0
  }

  const { meterImpact } = event
  let score = 0
  const target = 60

  for (const [meter, impact] of Object.entries(meterImpact)) {
    if (meter === 'summary' || typeof impact !== 'number') {
      continue
    }

    const current = meterStates[meter] ?? target

    if (impact > 0) {
      const deficit = Math.max(0, target - current) / target
      score += deficit * (Math.abs(impact) / 5)
    } else if (impact < 0) {
      const surplus = Math.max(0, current - target) / target
      score += surplus * (Math.abs(impact) / 5) * 0.75
    }
  }

  return score
}

const evaluateDifficultyAlignment = (
  event: DirectorEvent,
  difficulty: DirectorDifficulty,
): number => {
  const targetPressure = DIFFICULTY_PRESSURE_TARGET[difficulty]
  const gap = Math.abs(event.pressure - targetPressure)
  const scale = Math.max(1, targetPressure)
  const closeness = Math.max(0, 1 - gap / scale)

  return closeness
}

const classifyEvent = (event: DirectorEvent): DirectorMode => {
  if (event.id.includes('boss') || event.topic.toLowerCase().includes('boss')) {
    return 'boss_setup'
  }

  if (event.pressure >= 4) {
    return 'boss_setup'
  }

  if (event.relatedQuestionId) {
    return 'application'
  }

  return 'recall'
}

const pickMode = (counts: Record<DirectorMode, number>, totalDecisions: number): DirectorMode => {
  let bestMode: DirectorMode = 'application'
  let bestDeficit = -Infinity(Object.keys(TARGET_DISTRIBUTION) as DirectorMode[]).forEach(
    (mode) => {
      const targetCount = TARGET_DISTRIBUTION[mode] * (totalDecisions + 1)
      const current = counts[mode]
      const deficit = targetCount - current

      if (deficit > bestDeficit) {
        bestMode = mode
        bestDeficit = deficit
      }
    },
  )

  return bestMode
}

const clampMeters = (snapshot: DirectorMeterState): DirectorMeterState => {
  const next: DirectorMeterState = { ...snapshot }

  for (const [key, value] of Object.entries(snapshot)) {
    if (typeof value !== 'number') continue
    next[key] = Math.max(0, Math.min(100, Math.round(value)))
  }

  return next
}

const buildCandidates = (
  events: readonly DirectorEvent[],
  runtime: DirectorRuntimeState,
  context: DirectorPlanContextSnapshot,
  intendedMode: DirectorMode,
  difficulty: DirectorDifficulty,
  rng: RNG,
): DirectorCandidateInsight[] => {
  const mistakesByTopic = countMistakes(context.recentMistakes)
  const totalMistakes = context.recentMistakes.length
  const availableEvents = events.filter((event) => {
    if (events.length === 1) {
      return true
    }

    return event.id !== runtime.lastEventId
  })

  const candidates = (
    availableEvents.length > 0 ? availableEvents : events
  ).map<DirectorCandidateInsight>((event) => {
    const mode = classifyEvent(event)
    const mastery = normalizeMastery(context.masteryByTopic[event.topic])
    const masteryGap = 1 - mastery
    const masteryContribution = masteryGap * 1.8

    const mistakesForTopic = mistakesByTopic[event.topic] ?? 0
    const mistakeShare = totalMistakes === 0 ? 0 : mistakesForTopic / totalMistakes
    const mistakeContribution = mistakesForTopic > 0 ? 0.6 + mistakeShare * 1.2 : 0

    const meterContribution = evaluateMeterAlignment(event, context.meterStates)
    const difficultyContribution = evaluateDifficultyAlignment(event, difficulty)
    const modeMultiplier = mode === intendedMode ? 1.35 : 0.85
    const randomness = rng() * 0.25

    const rawWeight =
      (BASE_WEIGHT +
        masteryContribution +
        mistakeContribution +
        meterContribution +
        difficultyContribution) *
        modeMultiplier +
      randomness

    const weight = Math.max(MIN_WEIGHT, rawWeight)

    return {
      event,
      mode,
      weight,
      breakdown: {
        mastery: masteryContribution,
        mistakes: mistakeContribution,
        meters: meterContribution,
        difficulty: difficultyContribution,
        mode: modeMultiplier,
        randomness,
      },
    }
  })

  return candidates
}

const modifierCatalog: {
  id: string
  label: string
  condition: (context: DirectorPlanContextSnapshot, event: DirectorEvent | null) => boolean
}[] = [
  {
    id: 'modifier.rent-control',
    label: 'Municipal Rent Control in effect',
    condition: (context) => {
      const ownerRoi = context.meterStates.ownerROI
      return typeof ownerRoi === 'number' && ownerRoi < 55
    },
  },
  {
    id: 'modifier.voucher-inspection',
    label: 'Voucher Inspection this week',
    condition: (context) => {
      const compliance = context.meterStates.compliance ?? 100
      if (compliance < 60) return true
      return context.recentMistakes.some((mistake) => {
        const normalized = normalizeMistake(mistake)
        return normalized?.topic.toLowerCase().includes('njlad') ?? false
      })
    },
  },
  {
    id: 'modifier.court-backlog',
    label: 'Housing Court Backlog slowing filings',
    condition: (context) => context.day % 5 === 0,
  },
  {
    id: 'modifier.community-pressure',
    label: 'Community Advocacy Spotlight hits the property',
    condition: (context, event) => {
      if (event?.topic.toLowerCase().includes('njlad')) return true
      const trust = context.meterStates.residentTrust ?? 70
      return trust < 50
    },
  },
]

const buildModifiers = (
  context: DirectorPlanContextSnapshot,
  event: DirectorEvent | null,
  rng: RNG,
): string[] => {
  const active = modifierCatalog.filter((modifier) => modifier.condition(context, event))

  if (active.length === 0) {
    return rng() > 0.6 ? ['Regional Policy Brief Released'] : []
  }

  const shuffled = active
    .map<[number, string]>((modifier) => [rng(), modifier.label])
    .sort((a, b) => a[0] - b[0])
    .map(([, label]) => label)

  return shuffled.slice(0, 2)
}

const BASE_TIMER: Record<DirectorDifficulty, number> = {
  easy: 120_000,
  normal: 95_000,
  hard: 75_000,
}

const buildTimers = (
  difficulty: DirectorDifficulty,
  event: DirectorEvent | null,
  mode: DirectorMode,
  rng: RNG,
  recentMistakeCount: number,
): DirectorTimer[] => {
  const base = BASE_TIMER[difficulty]
  const pressure = event?.pressure ?? 0
  const pressureAdjustment = pressure * 6_000
  const mistakeAdjustment = Math.min(20_000, recentMistakeCount * 2_500)

  const responseWindow = Math.max(45_000, base - pressureAdjustment + mistakeAdjustment)
  const reviewWindow = base + 30_000 + Math.round(rng() * 15_000)

  const timers: DirectorTimer[] = [
    {
      id: 'timer.response',
      label: 'Response Window',
      durationMs: Math.round(responseWindow),
    },
    {
      id: 'timer.review',
      label: 'Follow-up Review',
      durationMs: Math.round(reviewWindow),
    },
  ]

  if (mode === 'boss_setup') {
    timers.push({
      id: 'timer.boss-prep',
      label: 'Boss Case Prep Countdown',
      durationMs: base + 60_000,
    })
  }

  return timers
}

const computeDistribution = (
  counts: Record<DirectorMode, number>,
): DirectorDistributionSnapshot => {
  const total = (Object.values(counts) as number[]).reduce((sum, value) => sum + value, 0)

  const actual = (Object.keys(counts) as DirectorMode[]).reduce<Record<DirectorMode, number>>(
    (acc, mode) => {
      acc[mode] = total === 0 ? 0 : counts[mode] / total
      return acc
    },
    { application: 0, recall: 0, boss_setup: 0 },
  )

  const deficits = (Object.keys(TARGET_DISTRIBUTION) as DirectorMode[]).reduce<
    Record<DirectorMode, number>
  >(
    (acc, mode) => {
      const targetCount = TARGET_DISTRIBUTION[mode] * (total + 1)
      acc[mode] = targetCount - counts[mode]
      return acc
    },
    { application: 0, recall: 0, boss_setup: 0 },
  )

  return { target: TARGET_DISTRIBUTION, actual, deficits }
}

const createDebugSnapshot = (state: DirectorRuntimeState): DirectorDebugSnapshot => {
  const candidates = state.candidates
    .map<DirectorDebugCandidateSnapshot>((candidate) => ({
      eventId: candidate.event.id,
      topic: candidate.event.topic,
      mode: candidate.mode,
      weight: candidate.weight,
      breakdown: candidate.breakdown,
    }))
    .sort((a, b) => b.weight - a.weight)

  return {
    enabled: state.debugEnabled,
    counts: { ...state.counts },
    distribution: computeDistribution(state.counts),
    lastDecision: state.lastDecision,
    lastContext: state.lastContext,
    intendedMode: state.intendedMode,
    candidates,
  }
}

export const createDirector = (config: DirectorConfig): DirectorService => {
  const controller = createRNGController(config.seed)
  const rng = controller.next

  const runtime: DirectorRuntimeState = {
    counts: { application: 0, recall: 0, boss_setup: 0 },
    lastEventId: null,
    lastDecision: null,
    lastContext: null,
    intendedMode: null,
    debugEnabled: false,
    candidates: [],
  }

  const planNext = (input: DirectorPlanInput): DirectorDecision => {
    const day = Math.max(1, Math.floor(input.day))
    const difficultyCurve = input.difficultyCurve ?? config.difficultyCurve
    const difficulty = resolveDifficulty(difficultyCurve, day)
    const totalDecisions = (Object.values(runtime.counts) as number[]).reduce(
      (sum, value) => sum + value,
      0,
    )
    const intendedMode = pickMode(runtime.counts, totalDecisions)

    const context: DirectorPlanContextSnapshot = {
      ...input,
      day,
      masteryByTopic: { ...input.masteryByTopic },
      meterStates: clampMeters(input.meterStates),
      recentMistakes: [...input.recentMistakes],
      difficultyCurve,
    }

    const candidates = buildCandidates(
      config.events,
      runtime,
      context,
      intendedMode,
      difficulty,
      rng,
    )
    runtime.candidates = candidates

    let selection: DirectorCandidateInsight | null = null

    if (candidates.length > 0) {
      const weighted: WeightedItem<DirectorCandidateInsight>[] = candidates.map((candidate) => ({
        value: candidate,
        weight: candidate.weight,
      }))

      selection = chooseWeighted(weighted, rng)
    }

    const selectedEvent = selection?.event ?? null
    const actualMode = selectedEvent ? classifyEvent(selectedEvent) : intendedMode

    if (selectedEvent) {
      runtime.lastEventId = selectedEvent.id
      runtime.counts[actualMode] += 1
    }

    const modifiers = buildModifiers(context, selectedEvent, rng)
    const timers = buildTimers(
      difficulty,
      selectedEvent,
      actualMode,
      rng,
      context.recentMistakes.length,
    )

    const decision: DirectorDecision = {
      event: selectedEvent,
      day,
      difficulty,
      mode: actualMode,
      intendedMode,
      modifiers,
      timers,
    }

    runtime.lastDecision = decision
    runtime.lastContext = context
    runtime.intendedMode = intendedMode

    return decision
  }

  const debug = (action: DirectorDebugAction = 'toggle'): DirectorDebugSnapshot => {
    if (action === 'toggle') {
      runtime.debugEnabled = !runtime.debugEnabled
    }

    return createDebugSnapshot(runtime)
  }

  const getState = (): DirectorRuntimeState => ({
    counts: { ...runtime.counts },
    lastEventId: runtime.lastEventId,
    lastDecision: runtime.lastDecision,
    lastContext: runtime.lastContext,
    intendedMode: runtime.intendedMode,
    debugEnabled: runtime.debugEnabled,
    candidates: [...runtime.candidates],
  })

  return {
    planNext,
    debug,
    getState,
  }
}
