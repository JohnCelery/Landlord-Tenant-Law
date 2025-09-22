import { useParams } from 'react-router-dom'
import { corePack } from '../data/packs'

const BossPage = () => {
  const { id } = useParams<{ id: string }>()
  const topic = corePack.topics.find((candidate) => candidate.toLowerCase().includes(id ?? ''))

  return (
    <section>
      <h2>Boss Case</h2>
      <p>
        Tackle the toughest scenario for
        <strong> {topic ?? 'your chosen track'}</strong>.
      </p>
      <p>
        Boss cases combine multiple events, timed choices, and bonus objectives. Expand the packs
        directory to add more boss arcs.
      </p>
    </section>
  )
}

export default BossPage
