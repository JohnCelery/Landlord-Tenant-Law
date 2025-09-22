import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { loadSave, persistSave, type SaveGame } from '../saves'
import type { MeterSnapshot } from '../scoring'
import { campaignBuildings, isBuildingUnlocked } from './buildings'

interface CampaignStateContextValue {
  meters: MeterSnapshot
  earnedBadges: readonly string[]
  activeModifiers: readonly string[]
  selectedBuildingId: string | null
  selectBuilding: (buildingId: string) => void
  grantBadge: (badgeId: string) => void
  revokeBadge: (badgeId: string) => void
  toggleModifier: (modifierId: string) => void
  isModifierActive: (modifierId: string) => boolean
}

const CampaignStateContext = createContext<CampaignStateContextValue | null>(null)

const ensureArrays = (save: SaveGame): SaveGame => ({
  ...save,
  earnedBadges: Array.isArray(save.earnedBadges) ? save.earnedBadges : [],
  activeModifiers: Array.isArray(save.activeModifiers) ? save.activeModifiers : [],
})

export const CampaignStateProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [save, setSave] = useState<SaveGame>(() => ensureArrays(loadSave()))
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)

  const commitSave = useCallback((updater: (current: SaveGame) => SaveGame) => {
    setSave((current) => {
      const next = ensureArrays(updater({ ...current, meters: { ...current.meters } }))
      persistSave(next)
      return next
    })
  }, [])

  useEffect(() => {
    setSelectedBuildingId((current) => {
      if (current) {
        const building = campaignBuildings.find((candidate) => candidate.id === current)
        if (building && isBuildingUnlocked(building, save.earnedBadges)) {
          return current
        }
      }

      const firstUnlocked = campaignBuildings.find((building) =>
        isBuildingUnlocked(building, save.earnedBadges),
      )

      return firstUnlocked?.id ?? null
    })
  }, [save.earnedBadges])

  const selectBuilding = useCallback(
    (buildingId: string) => {
      const building = campaignBuildings.find((candidate) => candidate.id === buildingId)

      if (!building) {
        return
      }

      if (!isBuildingUnlocked(building, save.earnedBadges)) {
        return
      }

      setSelectedBuildingId(buildingId)
    },
    [save.earnedBadges],
  )

  const grantBadge = useCallback(
    (badgeId: string) => {
      commitSave((current) => {
        if (current.earnedBadges.includes(badgeId)) {
          return current
        }

        return {
          ...current,
          earnedBadges: [...current.earnedBadges, badgeId],
        }
      })
    },
    [commitSave],
  )

  const revokeBadge = useCallback(
    (badgeId: string) => {
      commitSave((current) => ({
        ...current,
        earnedBadges: current.earnedBadges.filter((entry) => entry !== badgeId),
      }))
    },
    [commitSave],
  )

  const toggleModifier = useCallback(
    (modifierId: string) => {
      commitSave((current) => {
        const active = current.activeModifiers.includes(modifierId)

        return {
          ...current,
          activeModifiers: active
            ? current.activeModifiers.filter((entry) => entry !== modifierId)
            : [...current.activeModifiers, modifierId],
        }
      })
    },
    [commitSave],
  )

  const isModifierActive = useCallback(
    (modifierId: string) => save.activeModifiers.includes(modifierId),
    [save.activeModifiers],
  )

  const value = useMemo<CampaignStateContextValue>(
    () => ({
      meters: save.meters,
      earnedBadges: save.earnedBadges,
      activeModifiers: save.activeModifiers,
      selectedBuildingId,
      selectBuilding,
      grantBadge,
      revokeBadge,
      toggleModifier,
      isModifierActive,
    }),
    [
      save.meters,
      save.earnedBadges,
      save.activeModifiers,
      selectedBuildingId,
      selectBuilding,
      grantBadge,
      revokeBadge,
      toggleModifier,
      isModifierActive,
    ],
  )

  return <CampaignStateContext.Provider value={value}>{children}</CampaignStateContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCampaignState = (): CampaignStateContextValue => {
  const context = useContext(CampaignStateContext)

  if (!context) {
    throw new Error('useCampaignState must be used within a CampaignStateProvider')
  }

  return context
}
