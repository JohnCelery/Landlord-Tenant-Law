import type { WeightedItem, RNG } from '../rng'
import { chooseWeighted, createRNGController } from '../rng'

export type DirectorDifficulty = 'easy' | 'normal' | 'hard'

export interface DirectorEvent {
  id: string
  topic: string
  pressure: number
  description: string
}

export interface DirectorState {
  day: number
  difficulty: DirectorDifficulty
  rng: RNG
}

export interface DirectorConfig {
  startDifficulty: DirectorDifficulty
  seed?: number
}

export const createDirector = (config: DirectorConfig): DirectorState => {
  const controller = createRNGController(config.seed)

  return {
    day: 1,
    difficulty: config.startDifficulty,
    rng: controller.next,
  }
}

export const planEvents = <T extends DirectorEvent>(
  events: readonly T[],
  state: DirectorState,
): T | null => {
  if (events.length === 0) {
    return null
  }

  const weighted: WeightedItem<T>[] = events.map((event) => ({
    value: event,
    weight: Math.max(1, 5 - Math.abs(event.pressure - state.day)),
  }))

  return chooseWeighted(weighted, state.rng)
}

export const advanceDirector = (
  state: DirectorState,
  outcome: 'success' | 'failure',
): DirectorState => {
  const nextDifficulty: DirectorDifficulty = (() => {
    if (outcome === 'success') {
      if (state.difficulty === 'easy') return 'normal'
      if (state.difficulty === 'normal') return 'hard'
      return 'hard'
    }

    if (state.difficulty === 'hard') return 'normal'
    if (state.difficulty === 'normal') return 'easy'
    return 'easy'
  })()

  return {
    ...state,
    day: state.day + 1,
    difficulty: nextDifficulty,
  }
}
