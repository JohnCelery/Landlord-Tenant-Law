import { z } from 'zod'

import type { DirectorDifficulty } from '../../core/director'
import type { OutcomeDelta } from '../../core/scoring'

export const difficultySchema = z.enum(['easy', 'normal', 'hard'])
export type Difficulty = z.infer<typeof difficultySchema>

export const outcomeDeltaSchema = z.object({
  compliance: z.number().finite().optional(),
  residentTrust: z.number().finite().optional(),
  ownerROI: z.number().finite().optional(),
  risk: z.number().finite().optional(),
  summary: z.string(),
})
export type OutcomeDeltaSchema = z.infer<typeof outcomeDeltaSchema>

export const assetSlotSchema = z.object({
  key: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  aspect: z.string(),
  density: z.enum(['1x', '1.5x', '2x', '3x']),
  formatPreferred: z.string(),
  notes: z.string().optional(),
})
export type AssetSlot = z.infer<typeof assetSlotSchema>

const questionChoiceSchema = z.object({
  id: z.string(),
  label: z.string(),
  meterImpact: outcomeDeltaSchema.optional(),
  correct: z.boolean().optional(),
  followupEventId: z.string().optional(),
})

export const questionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  topic: z.string(),
  difficulty: difficultySchema,
  tags: z.array(z.string()).optional(),
  explanation: z.string().optional(),
  choices: z.array(questionChoiceSchema).min(2),
})
export type Question = z.infer<typeof questionSchema>

export const eventCardSchema = z.object({
  id: z.string(),
  topic: z.string(),
  pressure: z.number().int().nonnegative(),
  description: z.string(),
  meterImpact: outcomeDeltaSchema,
  citation: z.string().url().optional(),
  relatedQuestionId: z.string().optional(),
})
export type EventCard = z.infer<typeof eventCardSchema>

export const quitTimingSchema = z.enum([
  '3_days',
  '1_month',
  '2_months',
  '3_months',
  '18_months',
  '3_years',
  'other',
])
export type QuitTiming = z.infer<typeof quitTimingSchema>

export const noticeRuleSchema = z.object({
  id: z.string(),
  ground: z.string(),
  ceaseRequired: z.boolean(),
  quitTiming: quitTimingSchema,
  serviceOptions: z.array(z.string()).min(1),
  notes: z.string().optional(),
})
export type NoticeRule = z.infer<typeof noticeRuleSchema>

const bossObjectiveSchema = z.object({
  id: z.string(),
  description: z.string(),
  meterImpact: outcomeDeltaSchema.optional(),
})

export const bossCaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  overview: z.string(),
  difficulty: difficultySchema,
  objectives: z.array(bossObjectiveSchema).min(1),
  failState: z.string(),
  rewardBadges: z.array(z.string()).optional(),
})
export type BossCase = z.infer<typeof bossCaseSchema>

export const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  effects: z.array(z.string()).min(1),
})
export type Skill = z.infer<typeof skillSchema>

export const badgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string().optional(),
})
export type Badge = z.infer<typeof badgeSchema>

export const sessionEventSchema = z.object({
  id: z.string(),
  kind: z.string(),
  timestamp: z.string(),
  summary: z.string(),
  data: z.record(z.string(), z.unknown()).optional(),
})
export type SessionEvent = z.infer<typeof sessionEventSchema>

export const leaderboardEntrySchema = z.object({
  id: z.string(),
  rank: z.number().int().positive(),
  player: z.string(),
  score: z.number().finite(),
  submittedAt: z.string().optional(),
  notes: z.string().optional(),
})
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>

const npcLineSchema = z.object({
  speaker: z.string(),
  line: z.string(),
  emotion: z.string().optional(),
})

export const npcScriptSchema = z.object({
  id: z.string(),
  title: z.string(),
  role: z.string(),
  lines: z.array(npcLineSchema).min(1),
  triggers: z.array(z.string()).optional(),
})
export type NpcScript = z.infer<typeof npcScriptSchema>

export const contentPackSchema = z.object({
  id: z.string(),
  title: z.string(),
  version: z.string(),
  minAppVersion: z.string(),
  topics: z.array(z.string()).min(1),
  municipalities: z.array(z.string()).min(1),
  difficultyCurve: z.object({
    start: difficultySchema,
    mid: difficultySchema,
    late: difficultySchema,
  }),
  artSlotsRequired: z.array(z.string()),
  questions: z.array(questionSchema),
  events: z.array(eventCardSchema),
  noticeRules: z.array(noticeRuleSchema),
  bossCases: z.array(bossCaseSchema),
  npcScripts: z.array(npcScriptSchema),
  skills: z.array(skillSchema).optional().default([]),
  badges: z.array(badgeSchema).optional().default([]),
  sessionEvents: z.array(sessionEventSchema).optional().default([]),
  leaderboard: z.array(leaderboardEntrySchema).optional().default([]),
})

export type ContentPack = z.infer<typeof contentPackSchema>
export type ContentPackDifficultyCurve = ContentPack['difficultyCurve']

export const resolveDirectorDifficulty = (difficulty: Difficulty): DirectorDifficulty => difficulty
export const toOutcomeDelta = (delta: OutcomeDeltaSchema): OutcomeDelta => delta
