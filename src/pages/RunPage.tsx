import { createDirector, planEvents } from '../core/director'
import { useActivePack } from '../data/packs'

const RunPage = () => {
  const pack = useActivePack()
  const director = createDirector({ startDifficulty: pack.difficultyCurve.start })
  const nextEvent = planEvents(pack.events, director)

  return (
    <section>
      <h2>Scenario Run</h2>
      {nextEvent ? (
        <article className="card">
          <header>
            <h3>{nextEvent.topic}</h3>
            <p className="badge">Pressure {nextEvent.pressure}</p>
          </header>
          <p>{nextEvent.description}</p>
          {nextEvent.citation ? <p className="small-print">Source: {nextEvent.citation}</p> : null}
        </article>
      ) : (
        <p>No events available. Add more content packs to keep the campaign fresh.</p>
      )}
    </section>
  )
}

export default RunPage
