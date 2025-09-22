export interface MeterSnapshot {
  compliance: number
  residentTrust: number
  ownerROI: number
  risk: number
}

export interface OutcomeDelta {
  compliance?: number
  residentTrust?: number
  ownerROI?: number
  risk?: number
  summary: string
}

export const clampMeter = (value: number): number => {
  return Math.min(100, Math.max(0, Math.round(value)))
}

export const applyOutcome = (snapshot: MeterSnapshot, delta: OutcomeDelta): MeterSnapshot => ({
  compliance: clampMeter(snapshot.compliance + (delta.compliance ?? 0)),
  residentTrust: clampMeter(snapshot.residentTrust + (delta.residentTrust ?? 0)),
  ownerROI: clampMeter(snapshot.ownerROI + (delta.ownerROI ?? 0)),
  risk: clampMeter(snapshot.risk + (delta.risk ?? 0)),
})

export const describeOutcome = (snapshot: MeterSnapshot, delta: OutcomeDelta): string => {
  const next = applyOutcome(snapshot, delta)
  const direction = (value: number, current: number) => {
    if (value > current) return 'up'
    if (value < current) return 'down'
    return 'steady'
  }

  return [
    `Compliance ${direction(next.compliance, snapshot.compliance)}`,
    `Resident Trust ${direction(next.residentTrust, snapshot.residentTrust)}`,
    `Owner ROI ${direction(next.ownerROI, snapshot.ownerROI)}`,
    `Risk ${direction(next.risk, snapshot.risk)}`,
    delta.summary,
  ].join(' · ')
}

export const defaultMeters: MeterSnapshot = {
  compliance: 70,
  residentTrust: 70,
  ownerROI: 60,
  risk: 40,
}
