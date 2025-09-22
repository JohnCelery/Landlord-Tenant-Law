import { shuffle } from '../utils/rand'
import { useActivePack } from '../data/packs'

const DailyPage = () => {
  const pack = useActivePack()
  const featured = shuffle(pack.events).slice(0, 3)

  return (
    <section>
      <h2>Daily Challenge</h2>
      <p>Beat the clock on these curated events to earn streak bonuses.</p>
      <ul className="card-grid">
        {featured.map((event) => (
          <li key={event.id} className="card">
            <h3>{event.topic}</h3>
            <p>{event.description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default DailyPage
