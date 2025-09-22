import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultMeters } from './scoring'
import { createSeededRNG, type RNG } from '../utils/rand'

const STORAGE_KEY = 'gsm.game-state'
const BACKUP_KEY = 'gsm.game-state.backup'

export interface GameMeters {
  compliance: number
  trust: number
  roi: number
  risk: number
}

export interface MasteryStats {
  right: number
  wrong: number
}

export type MasteryRecord = Record<string, MasteryStats>

export interface GameStateSnapshot {
  day: number
  runId: string
  runSeed: number
  coins: number
  xp: number
  meters: GameMeters
  skills: string[]
  badges: string[]
  inventory: string[]
  mastery: MasteryRecord
  streakDays: number
  hintsUsed: number
}

interface GameStateActions {
  startRun: (seed?: number) => number
  setDay: (day: number) => void
  advanceDay: () => void
  setXp: (xp: number) => void
  addXp: (delta: number) => void
  setCoins: (coins: number) => void
  adjustCoins: (delta: number) => void
  setMeters: (meters: GameMeters) => void
  updateMeter: (meter: keyof GameMeters, value: number) => void
  setSkills: (skills: string[]) => void
  unlockSkill: (skillId: string) => void
  setBadges: (badges: string[]) => void
  addBadge: (badgeId: string) => void
  setInventory: (items: string[]) => void
  addInventoryItem: (item: string) => void
  removeInventoryItem: (item: string) => void
  setMastery: (mastery: MasteryRecord) => void
  recordMastery: (topic: string, correct: boolean) => void
  resetMastery: (topic?: string) => void
  setStreakDays: (value: number) => void
  incrementStreak: () => void
  resetStreak: () => void
  setHintsUsed: (value: number) => void
  incrementHintsUsed: () => void
  resetHints: () => void
  createSnapshot: () => GameStateSnapshot
  loadSnapshot: (snapshot: GameStateSnapshot) => void
  saveToStorage: () => boolean
  restoreFromStorage: () => boolean
}

export type GameStateStore = GameStateSnapshot & {
  rng: RNG
}

export const toGameMeters = (snapshot: {
  compliance: number
  residentTrust?: number
  trust?: number
  ownerROI?: number
  roi?: number
  risk: number
}): GameMeters => ({
  compliance: snapshot.compliance,
  trust: snapshot.residentTrust ?? snapshot.trust ?? 0,
  roi: snapshot.ownerROI ?? snapshot.roi ?? 0,
  risk: snapshot.risk,
})

export const fromGameMeters = (meters: GameMeters) => ({
  compliance: meters.compliance,
  residentTrust: meters.trust,
  ownerROI: meters.roi,
  risk: meters.risk,
})

const normalizeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value)
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)

    if (Number.isFinite(parsed)) {
      return Math.round(parsed)
    }
  }

  return fallback
}

const normalizeMeters = (meters?: Partial<GameMeters> | null): GameMeters => ({
  compliance: Math.max(0, normalizeNumber(meters?.compliance, 0)),
  trust: Math.max(0, normalizeNumber(meters?.trust, 0)),
  roi: Math.max(0, normalizeNumber(meters?.roi, 0)),
  risk: Math.max(0, normalizeNumber(meters?.risk, 0)),
})

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(new Set(value.filter((entry): entry is string => typeof entry === 'string')))
}

const normalizeMastery = (value: unknown): MasteryRecord => {
  if (!value || typeof value !== 'object') {
    return {}
  }

  return Object.entries(value as Record<string, unknown>).reduce<MasteryRecord>(
    (acc, [topic, stats]) => {
      if (!stats || typeof stats !== 'object') {
        return acc
      }

      const snapshot = stats as { right?: unknown; wrong?: unknown }
      acc[topic] = {
        right: Math.max(0, normalizeNumber(snapshot.right, 0)),
        wrong: Math.max(0, normalizeNumber(snapshot.wrong, 0)),
      }

      return acc
    },
    {},
  )
}

const createDefaultSnapshot = (): GameStateSnapshot => ({
  day: 1,
  runId: '',
  runSeed: Math.floor(Math.random() * 1_000_000),
  coins: 0,
  xp: 0,
  meters: toGameMeters(defaultMeters),
  skills: [],
  badges: [],
  inventory: [],
  mastery: {},
  streakDays: 0,
  hintsUsed: 0,
})

const createRunId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

const isBrowser = typeof window !== 'undefined'

let hydrateSnapshot: ((snapshot: GameStateSnapshot) => void) | undefined

export const useGameState = create<GameStateStore & GameStateActions>()(
  persist(
    (set, get) => {
      const applySnapshot = (snapshot: GameStateSnapshot) => {
        const seed =
          Math.max(0, Math.floor(snapshot.runSeed)) || Math.floor(Math.random() * 1_000_000)
        const runId = snapshot.runId && snapshot.runId.length > 0 ? snapshot.runId : createRunId()

        set({
          day: Math.max(1, Math.round(snapshot.day)),
          runId,
          runSeed: seed,
          coins: Math.max(0, Math.round(snapshot.coins)),
          xp: Math.max(0, Math.round(snapshot.xp)),
          meters: normalizeMeters(snapshot.meters),
          skills: normalizeStringArray(snapshot.skills),
          badges: normalizeStringArray(snapshot.badges),
          inventory: normalizeStringArray(snapshot.inventory),
          mastery: normalizeMastery(snapshot.mastery),
          streakDays: Math.max(0, Math.round(snapshot.streakDays)),
          hintsUsed: Math.max(0, Math.round(snapshot.hintsUsed)),
          rng: createSeededRNG(seed),
        })
      }

      hydrateSnapshot = applySnapshot

      return {
        ...createDefaultSnapshot(),
        rng: createSeededRNG(),
        startRun: (seed?: number) => {
          const actualSeed =
            typeof seed === 'number' && Number.isFinite(seed)
              ? Math.floor(seed)
              : Math.floor(Math.random() * 1_000_000)
          const base = createDefaultSnapshot()

          set({
            ...base,
            runId: createRunId(),
            runSeed: actualSeed,
            rng: createSeededRNG(actualSeed),
            meters: normalizeMeters(base.meters),
            skills: [...base.skills],
            badges: [...base.badges],
            inventory: [...base.inventory],
            mastery: { ...base.mastery },
          })

          return actualSeed
        },
        setDay: (day: number) => {
          set({ day: Math.max(1, Math.round(day)) })
        },
        advanceDay: () => {
          set((state) => ({ day: state.day + 1 }))
        },
        setXp: (xp: number) => {
          set({ xp: Math.max(0, Math.round(xp)) })
        },
        addXp: (delta: number) => {
          set((state) => ({ xp: Math.max(0, state.xp + delta) }))
        },
        setCoins: (coins: number) => {
          set({ coins: Math.max(0, Math.round(coins)) })
        },
        adjustCoins: (delta: number) => {
          set((state) => ({ coins: Math.max(0, state.coins + delta) }))
        },
        setMeters: (meters: GameMeters) => {
          set({ meters: normalizeMeters(meters) })
        },
        updateMeter: (meter: keyof GameMeters, value: number) => {
          set((state) => ({
            meters: {
              ...state.meters,
              [meter]: Math.max(0, Math.round(value)),
            },
          }))
        },
        setSkills: (skills: string[]) => {
          set({ skills: normalizeStringArray(skills) })
        },
        unlockSkill: (skillId: string) => {
          if (typeof skillId !== 'string') {
            return
          }

          set((state) => {
            const skills = state.skills.includes(skillId)
              ? state.skills
              : [...state.skills, skillId]

            return { skills }
          })
        },
        setBadges: (badges: string[]) => {
          set({ badges: normalizeStringArray(badges) })
        },
        addBadge: (badgeId: string) => {
          if (typeof badgeId !== 'string') {
            return
          }

          set((state) => {
            const badges = state.badges.includes(badgeId)
              ? state.badges
              : [...state.badges, badgeId]

            return { badges }
          })
        },
        setInventory: (items: string[]) => {
          set({ inventory: normalizeStringArray(items) })
        },
        addInventoryItem: (item: string) => {
          if (typeof item !== 'string') {
            return
          }

          set((state) => {
            const inventory = state.inventory.includes(item)
              ? state.inventory
              : [...state.inventory, item]

            return { inventory }
          })
        },
        removeInventoryItem: (item: string) => {
          set((state) => ({
            inventory: state.inventory.filter((entry) => entry !== item),
          }))
        },
        setMastery: (mastery: MasteryRecord) => {
          set({ mastery: normalizeMastery(mastery) })
        },
        recordMastery: (topic: string, correct: boolean) => {
          if (typeof topic !== 'string' || topic.length === 0) {
            return
          }

          set((state) => {
            const current = state.mastery[topic] ?? { right: 0, wrong: 0 }
            const next: MasteryStats = {
              right: current.right + (correct ? 1 : 0),
              wrong: current.wrong + (correct ? 0 : 1),
            }

            return {
              mastery: {
                ...state.mastery,
                [topic]: next,
              },
            }
          })
        },
        resetMastery: (topic?: string) => {
          if (!topic) {
            set({ mastery: {} })
            return
          }

          set((state) => {
            const next = { ...state.mastery }
            delete next[topic]
            return { mastery: next }
          })
        },
        setStreakDays: (value: number) => {
          set({ streakDays: Math.max(0, Math.round(value)) })
        },
        incrementStreak: () => {
          set((state) => ({ streakDays: state.streakDays + 1 }))
        },
        resetStreak: () => {
          set({ streakDays: 0 })
        },
        setHintsUsed: (value: number) => {
          set({ hintsUsed: Math.max(0, Math.round(value)) })
        },
        incrementHintsUsed: () => {
          set((state) => ({ hintsUsed: state.hintsUsed + 1 }))
        },
        resetHints: () => {
          set({ hintsUsed: 0 })
        },
        createSnapshot: () => {
          const state = get()
          return {
            day: state.day,
            runId: state.runId,
            runSeed: state.runSeed,
            coins: state.coins,
            xp: state.xp,
            meters: { ...state.meters },
            skills: [...state.skills],
            badges: [...state.badges],
            inventory: [...state.inventory],
            mastery: Object.fromEntries(
              Object.entries(state.mastery).map(([topic, stats]) => [topic, { ...stats }]),
            ),
            streakDays: state.streakDays,
            hintsUsed: state.hintsUsed,
          }
        },
        loadSnapshot: (snapshot: GameStateSnapshot) => {
          applySnapshot(snapshot)
        },
        saveToStorage: () => {
          if (!isBrowser) {
            return false
          }

          try {
            const snapshot = get().createSnapshot()
            window.localStorage.setItem(BACKUP_KEY, JSON.stringify(snapshot))
            return true
          } catch (error) {
            console.warn('Failed to save game snapshot', error)
            return false
          }
        },
        restoreFromStorage: () => {
          if (!isBrowser) {
            return false
          }

          const raw = window.localStorage.getItem(BACKUP_KEY)

          if (!raw) {
            return false
          }

          try {
            const parsed = JSON.parse(raw) as GameStateSnapshot
            applySnapshot(parsed)
            return true
          } catch (error) {
            console.warn('Failed to restore game snapshot', error)
            return false
          }
        },
      }
    },
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (state) => {
        const snapshot = {
          day: state.day,
          runId: state.runId,
          runSeed: state.runSeed,
          coins: state.coins,
          xp: state.xp,
          meters: state.meters,
          skills: state.skills,
          badges: state.badges,
          inventory: state.inventory,
          mastery: state.mastery,
          streakDays: state.streakDays,
          hintsUsed: state.hintsUsed,
        }

        return snapshot
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          try {
            hydrateSnapshot?.(state as GameStateSnapshot)
          } catch (error) {
            console.warn('Failed to hydrate game state', error)
            const fallback = createDefaultSnapshot()
            hydrateSnapshot?.({ ...fallback, runId: createRunId() })
          }
        }
      },
    },
  ),
)
