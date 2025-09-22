import type { DirectorEvent } from '../director'
import type { OutcomeDelta } from '../scoring'

export interface MapModifierDefinition {
  id: string
  name: string
  description: string
  effectSummary: string
  directorNote: string
  eventFilter?: (event: DirectorEvent) => boolean
  adjustOutcome?: (context: { event: DirectorEvent | null; outcome: OutcomeDelta }) => OutcomeDelta
}

const applyRentControl = ({
  event,
  outcome,
}: {
  event: DirectorEvent | null
  outcome: OutcomeDelta
}): OutcomeDelta => {
  if (!event) {
    return outcome
  }

  if (!event.topic.toLowerCase().includes('rent')) {
    return outcome
  }

  const ownerROI = outcome.ownerROI ?? 0
  const compliance = outcome.compliance ?? 0
  const summarySuffix = 'Rent control caps ROI gains and raises compliance scrutiny.'

  return {
    ...outcome,
    ownerROI: ownerROI > 0 ? Math.max(-10, Math.ceil(ownerROI * 0.5)) : ownerROI,
    compliance: compliance >= 0 ? compliance + 1 : compliance - 1,
    summary: outcome.summary.includes(summarySuffix)
      ? outcome.summary
      : `${outcome.summary} (${summarySuffix})`,
  }
}

const applyReinspectionWeek = ({
  event,
  outcome,
}: {
  event: DirectorEvent | null
  outcome: OutcomeDelta
}): OutcomeDelta => {
  if (!event) {
    return outcome
  }

  const topic = event.topic.toLowerCase()

  if (topic.includes('notice') || topic.includes('njlad')) {
    const trust = outcome.residentTrust ?? 0
    const compliance = outcome.compliance ?? 0
    const summarySuffix = 'Inspection blitz boosts trust for equity-aligned work.'

    return {
      ...outcome,
      residentTrust: trust + 1,
      compliance: compliance + 1,
      summary: outcome.summary.includes(summarySuffix)
        ? outcome.summary
        : `${outcome.summary} (${summarySuffix})`,
    }
  }

  return outcome
}

export const MAP_MODIFIERS: MapModifierDefinition[] = [
  {
    id: 'modifier.rentControlCity',
    name: 'Rent Control City',
    description: 'Cap rent adjustments and lean into habitability enforcement for this run.',
    effectSummary:
      'Owner ROI gains from rent events are halved while compliance scoring climbs when rent moves stay lawful.',
    directorNote:
      'Rent Control City active — prioritize affordability optics and tempered rent strategies.',
    adjustOutcome: applyRentControl,
  },
  {
    id: 'modifier.hqsReinspectionWeek',
    name: 'HQS Re-inspection Week',
    description: 'HUD re-checks push staff to clear equity and notice items before deposits.',
    effectSummary:
      'Deposit actions are paused; NJLAD and Notice events grant extra trust when resolved during the blitz.',
    directorNote:
      'HQS Re-inspection Week — deposit playbooks are off the table while inspection teams chase equity wins.',
    eventFilter: (event) => !event.topic.toLowerCase().includes('deposit'),
    adjustOutcome: applyReinspectionWeek,
  },
]

export const getMapModifier = (modifierId: string): MapModifierDefinition | undefined => {
  return MAP_MODIFIERS.find((modifier) => modifier.id === modifierId)
}

export const filterEventsForActiveModifiers = (
  events: readonly DirectorEvent[],
  activeModifierIds: readonly string[],
): DirectorEvent[] => {
  const filters = MAP_MODIFIERS.filter(
    (modifier) => activeModifierIds.includes(modifier.id) && modifier.eventFilter,
  ).map((modifier) => modifier.eventFilter!)

  if (filters.length === 0) {
    return [...events]
  }

  const filtered = events.filter((event) => filters.every((predicate) => predicate(event)))

  return filtered.length > 0 ? filtered : [...events]
}

export const applyModifiersToOutcome = (
  event: DirectorEvent | null,
  outcome: OutcomeDelta,
  activeModifierIds: readonly string[],
): OutcomeDelta => {
  return MAP_MODIFIERS.filter(
    (modifier) => activeModifierIds.includes(modifier.id) && modifier.adjustOutcome,
  ).reduce<OutcomeDelta>((current, modifier) => {
    return modifier.adjustOutcome!({ event, outcome: current })
  }, outcome)
}

export const collectModifierNotes = (activeModifierIds: readonly string[]): readonly string[] => {
  return MAP_MODIFIERS.filter((modifier) => activeModifierIds.includes(modifier.id)).map(
    (modifier) => modifier.directorNote,
  )
}
