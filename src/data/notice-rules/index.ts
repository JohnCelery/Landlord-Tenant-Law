export type QuitTiming =
  | '3_days'
  | '1_month'
  | '2_months'
  | '3_months'
  | '18_months'
  | '3_years'
  | 'other'

export interface NoticeRule {
  ground: string
  ceaseRequired: boolean
  quitTiming: QuitTiming
  serviceOptions: string[]
  notes?: string
}

export interface NoticeRuleSet {
  id: string
  title: string
  rules: NoticeRule[]
}

export const coreNoticeRules: NoticeRuleSet = {
  id: 'core-notice-rules',
  title: 'Core Anti-Eviction Act Grounds',
  rules: [
    {
      ground: 'Non-payment of rent',
      ceaseRequired: false,
      quitTiming: '3_days',
      serviceOptions: ['personal', 'certified_then_regular'],
      notes: 'Certified mail followed by regular is preferred when personal service fails.',
    },
    {
      ground: 'Habitual late payment',
      ceaseRequired: true,
      quitTiming: '1_month',
      serviceOptions: ['personal', 'posting_with_photos'],
    },
    {
      ground: 'Owner occupancy',
      ceaseRequired: false,
      quitTiming: '2_months',
      serviceOptions: ['personal', 'substitute_service'],
      notes: 'Outside the statute defaults; adjust to local ordinance.',
    },
  ],
}
