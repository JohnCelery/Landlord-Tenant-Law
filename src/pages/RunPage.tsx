import { createDirector, planEvents } from '../core/director'
import { corePack } from '../data/packs'

const RunPage = () => {
  const director = createDirector({ startDifficulty: corePack.difficultyCurve.start })
  const nextEvent = planEvents(corePack.events, director)

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
          <p className="small-print">Source: {nextEvent.citation}</p>
        </article>
      ) : (
        <p>No events available. Add more content packs to keep the campaign fresh.</p>
      )}
    </section>
  )
}

export default RunPage
