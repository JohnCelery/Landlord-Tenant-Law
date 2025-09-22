import type { DirectorEvent } from '../../core/director'
import type { OutcomeDelta } from '../../core/scoring'

export interface PackMetadata {
  id: string
  title: string
  version: string
  topics: string[]
  municipalities: string[]
}

export interface PackEvent extends DirectorEvent {
  meterImpact: OutcomeDelta
  citation: string
}

export interface ContentPack extends PackMetadata {
  difficultyCurve: {
    start: 'easy' | 'normal' | 'hard'
    mid: 'easy' | 'normal' | 'hard'
    late: 'easy' | 'normal' | 'hard'
  }
  artSlotsRequired: string[]
  noticeRulesId: string
  events: PackEvent[]
}

export const corePack: ContentPack = {
  id: 'core',
  title: 'Core NJ Pack',
  version: '1.0.0',
  topics: ['NJLAD', 'FCHA', 'Notices', 'Deposits', 'Rent'],
  municipalities: ['Jersey City', 'Newark', 'Elizabeth'],
  difficultyCurve: {
    start: 'easy',
    mid: 'normal',
    late: 'hard',
  },
  artSlotsRequired: ['ui.map.bg.nj.portrait', 'badge.noticeNinja', 'building.noticeCenter'],
  noticeRulesId: 'core-notice-rules',
  events: [
    {
      id: 'event.welcome-inspection',
      topic: 'NJLAD',
      pressure: 1,
      description: 'A HUD inspector flags missing reasonable accommodations logs.',
      meterImpact: {
        compliance: 5,
        residentTrust: 3,
        risk: -2,
        summary: 'Proactively fix documentation gaps to build trust.',
      },
      citation: 'https://www.nj.gov/lps/dcr/',
    },
    {
      id: 'event.notice-escalation',
      topic: 'Notices',
      pressure: 3,
      description: 'Resident disputes the timing on a rent-due notice.',
      meterImpact: {
        compliance: -4,
        ownerROI: -2,
        risk: 6,
        summary: 'Late notices without service proof invite disputes.',
      },
      citation: 'https://www.nj.gov/dca/',
    },
  ],
}
