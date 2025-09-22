import type { Badge } from '../../data/packs'

export interface CampaignBuildingDefinition {
  id: string
  name: string
  description: string
  lore: string
  topics: readonly string[] | 'all'
  requiredBadgeId?: string | null
  rewardBadgeId?: string | null
  position: {
    x: number
    y: number
  }
}

export interface CampaignBuildingViewModel extends CampaignBuildingDefinition {
  unlocked: boolean
  requiredBadge?: Badge | null
  rewardBadge?: Badge | null
}

export const campaignBuildings: CampaignBuildingDefinition[] = [
  {
    id: 'building.subsidies',
    name: 'Subsidies',
    description: 'Coordinate voucher compliance across county and federal partners.',
    lore: 'Ground floor outreach hub for subsidy audits and landlord onboarding.',
    topics: ['FCHA'],
    rewardBadgeId: 'badge.subsidyNavigator',
    position: { x: 56, y: 12 },
  },
  {
    id: 'building.njlad',
    name: 'NJLAD',
    description: 'Sharpen anti-discrimination responses under the NJ Law Against Discrimination.',
    lore: 'Civil rights legal team occupies the mezzanine, ready to jump on bias complaints.',
    topics: ['NJLAD'],
    requiredBadgeId: 'badge.subsidyNavigator',
    rewardBadgeId: 'badge.njladSentinel',
    position: { x: 66, y: 30 },
  },
  {
    id: 'building.notices',
    name: 'Notices',
    description:
      'Draft bulletproof notices and service logs before contested filings hit the docket.',
    lore: 'Paralegals stack certified mail receipts like trading cards in this tower.',
    topics: ['Notices'],
    requiredBadgeId: 'badge.njladSentinel',
    rewardBadgeId: 'badge.noticeNinja',
    position: { x: 52, y: 46 },
  },
  {
    id: 'building.deposits',
    name: 'Deposits',
    description: 'Track ledgers, interest, and return deadlines for every security deposit.',
    lore: 'Finance ops shares the floor with the dispute hotline to keep refunds smooth.',
    topics: ['Deposits'],
    requiredBadgeId: 'badge.noticeNinja',
    rewardBadgeId: 'badge.depositDefender',
    position: { x: 42, y: 62 },
  },
  {
    id: 'building.rent',
    name: 'Rent Increases',
    description: 'Plan compliant rent adjustments while balancing trust and ROI expectations.',
    lore: 'Policy analysts war-game council hearings and CPI triggers from a wall of dashboards.',
    topics: ['Rent'],
    requiredBadgeId: 'badge.depositDefender',
    rewardBadgeId: 'badge.rentGuardian',
    position: { x: 54, y: 78 },
  },
  {
    id: 'building.mixed',
    name: 'Mixed',
    description: 'Blend advanced cases across statutes once the full campus is operational.',
    lore: 'The penthouse command center coordinates cross-topic drills and live incidents.',
    topics: 'all',
    requiredBadgeId: 'badge.rentGuardian',
    rewardBadgeId: 'badge.mixedStrategist',
    position: { x: 72, y: 88 },
  },
]

export const isBuildingUnlocked = (
  building: CampaignBuildingDefinition,
  earnedBadges: readonly string[],
): boolean => {
  if (!building.requiredBadgeId) {
    return true
  }

  return earnedBadges.includes(building.requiredBadgeId)
}

export const resolveBuildingTopics = (
  building: CampaignBuildingDefinition,
  availableTopics: readonly string[],
): readonly string[] => {
  if (building.topics === 'all') {
    return availableTopics
  }

  return building.topics
}

export const hydrateBuildingView = (
  building: CampaignBuildingDefinition,
  badges: readonly Badge[],
  earnedBadges: readonly string[],
): CampaignBuildingViewModel => {
  const unlocked = isBuildingUnlocked(building, earnedBadges)
  const requiredBadge = badges.find((badge) => badge.id === building.requiredBadgeId)
  const rewardBadge = badges.find((badge) => badge.id === building.rewardBadgeId)

  return {
    ...building,
    unlocked,
    requiredBadge: requiredBadge ?? null,
    rewardBadge: rewardBadge ?? null,
  }
}
