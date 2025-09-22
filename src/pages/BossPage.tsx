import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useActivePack } from '../data/packs'

const BossPage = () => {
  const { id } = useParams<{ id: string }>()
  const pack = useActivePack()

  const bossCase = useMemo(() => {
    if (!id) {
      return pack.bossCases.at(0) ?? null
    }

    return (
      pack.bossCases.find((boss) => boss.id === id) ??
      pack.bossCases.find((boss) => boss.id.toLowerCase().includes(id.toLowerCase())) ??
      null
    )
  }, [id, pack.bossCases])

  const inferredTopic = useMemo(() => {
    if (!id) {
      return pack.topics[0]
    }

    return pack.topics.find((topic) => topic.toLowerCase().includes(id.toLowerCase()))
  }, [id, pack.topics])

  if (!bossCase) {
    return (
      <section>
        <h2>Boss Case</h2>
        <p>No boss scenarios are defined for this content pack yet.</p>
      </section>
    )
  }

  return (
    <section>
      <h2>{bossCase.title}</h2>
      <p>
        Tackle the toughest scenario for
        <strong> {inferredTopic ?? 'your chosen track'}</strong>.
      </p>
      <p>{bossCase.overview}</p>
      <div className="card">
        <h3>Objectives</h3>
        <ol>
          {bossCase.objectives.map((objective) => (
            <li key={objective.id}>
              <strong>{objective.description}</strong>
              {objective.meterImpact ? (
                <span className="small-print"> — {objective.meterImpact.summary}</span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
      <p className="small-print">Fail state: {bossCase.failState}</p>
    </section>
  )
}

export default BossPage
