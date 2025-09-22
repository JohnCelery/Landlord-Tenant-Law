export type RNG = () => number

export interface WeightedItem<T> {
  value: T
  weight: number
}

const MAX_INT = 0x7fffffff

export const createSeededRNG = (seed: number = Date.now()): RNG => {
  let state = seed % MAX_INT
  if (state <= 0) {
    state += MAX_INT - 1
  }

  return () => {
    state = (Math.imul(48271, state) + 0) % MAX_INT
    return state / MAX_INT
  }
}

export const randomInt = (max: number, rng: RNG = Math.random): number => {
  return Math.floor(rng() * max)
}

export const sample = <T>(items: readonly T[], rng: RNG = Math.random): T => {
  if (items.length === 0) {
    throw new Error('Cannot sample from an empty collection')
  }

  const index = randomInt(items.length, rng)
  return items[index]
}

export const weightedSample = <T>(items: readonly WeightedItem<T>[], rng: RNG = Math.random): T => {
  if (items.length === 0) {
    throw new Error('Cannot sample from an empty collection')
  }

  const totalWeight = items.reduce((sum, item) => sum + Math.max(item.weight, 0), 0)

  if (totalWeight === 0) {
    throw new Error('Cannot sample when all weights are zero')
  }

  const threshold = rng() * totalWeight
  let cumulative = 0

  for (const entry of items) {
    cumulative += Math.max(entry.weight, 0)

    if (threshold <= cumulative) {
      return entry.value
    }
  }

  return items[items.length - 1]!.value
}

export const shuffle = <T>(items: readonly T[], rng: RNG = Math.random): T[] => {
  const result = [...items]

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }

  return result
}
