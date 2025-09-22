export interface Stopwatch {
  start: () => void
  stop: () => number
  reset: () => void
  read: () => number
}

export const createStopwatch = (): Stopwatch => {
  let startTime: number | null = null
  let elapsed = 0

  return {
    start() {
      if (startTime === null) {
        startTime = performance.now()
      }
    },
    stop() {
      if (startTime !== null) {
        elapsed += performance.now() - startTime
        startTime = null
      }

      return elapsed
    },
    reset() {
      startTime = null
      elapsed = 0
    },
    read() {
      if (startTime === null) {
        return elapsed
      }

      return elapsed + (performance.now() - startTime)
    },
  }
}

export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })

export const formatDuration = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
