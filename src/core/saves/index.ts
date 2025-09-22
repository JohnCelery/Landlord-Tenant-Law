import type { MeterSnapshot } from '../scoring'
import { defaultMeters } from '../scoring'

const STORAGE_KEY = 'gsm.campaign'

export interface SaveGame {
  version: number
  lastPlayed: string
  meters: MeterSnapshot
  streak: number
  earnedBadges: string[]
  activeModifiers: string[]
}

export const createInitialSave = (): SaveGame => ({
  version: 1,
  lastPlayed: new Date(0).toISOString(),
  meters: { ...defaultMeters },
  streak: 0,
  earnedBadges: [],
  activeModifiers: [],
})

export const loadSave = (): SaveGame => {
  if (typeof window === 'undefined') {
    return createInitialSave()
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return createInitialSave()
  }

  try {
    const parsed = JSON.parse(raw) as SaveGame
    return { ...createInitialSave(), ...parsed }
  } catch (error) {
    console.warn('Failed to parse save data, resetting.', error)
    return createInitialSave()
  }
}

export const persistSave = (save: SaveGame) => {
  if (typeof window === 'undefined') {
    return
  }

  const payload: SaveGame = {
    ...save,
    meters: { ...save.meters },
    earnedBadges: [...save.earnedBadges],
    activeModifiers: [...save.activeModifiers],
    lastPlayed: new Date().toISOString(),
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}
