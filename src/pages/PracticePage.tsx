import { useEffect, useRef, useState } from 'react'
import { createStopwatch, formatDuration } from '../utils/timers'

const PracticePage = () => {
  const [stopwatch] = useState(() => createStopwatch())
  const [elapsed, setElapsed] = useState(0)
  const frameRef = useRef<number | null>(null)

  const tick = () => {
    setElapsed(stopwatch.read())
    frameRef.current = requestAnimationFrame(tick)
  }

  const handleStart = () => {
    if (frameRef.current !== null) {
      return
    }

    stopwatch.start()
    frameRef.current = requestAnimationFrame(tick)
  }

  const handleReset = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    stopwatch.reset()
    setElapsed(0)
  }

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  return (
    <section>
      <h2>Practice Arena</h2>
      <p>Use drills to focus on a single skill and track your timing improvements.</p>
      <div className="card">
        <p>Elapsed time: {formatDuration(elapsed)}</p>
        <div className="button-row">
          <button type="button" onClick={handleStart}>
            Start drill
          </button>
          <button type="button" onClick={handleReset} className="secondary">
            Reset
          </button>
        </div>
      </div>
    </section>
  )
}

export default PracticePage
