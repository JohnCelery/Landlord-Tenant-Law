import { createSeededRNG, type RNG, type WeightedItem, weightedSample } from '../../utils/rand'

export interface RNGController {
  seed: number
  next: () => number
  fork: (salt?: number) => RNGController
}

export const createRNGController = (seed: number = Date.now()): RNGController => {
  const generator = createSeededRNG(seed)
  let currentSeed = seed

  return {
    seed,
    next: () => {
      const value = generator()
      currentSeed = Math.floor(value * Number.MAX_SAFE_INTEGER)
      return value
    },
    fork(salt = 1) {
      return createRNGController(currentSeed + salt)
    },
  }
}

export const rollSkillCheck = (
  rng: RNG,
  modifier: number,
  difficulty: number,
): { passed: boolean; total: number } => {
  const roll = Math.floor(rng() * 100) + 1
  const total = roll + modifier

  return { passed: total >= difficulty, total }
}

export const chooseWeighted = <T>(items: readonly WeightedItem<T>[], rng: RNG): T => {
  return weightedSample(items, rng)
}

export type { RNG, WeightedItem }
