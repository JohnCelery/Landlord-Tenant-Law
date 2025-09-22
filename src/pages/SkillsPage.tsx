import { useActivePack } from '../data/packs'
import { defaultMeters } from '../core/scoring'

const SkillsPage = () => {
  const pack = useActivePack()
  const skills = pack.skills ?? []
  const badges = pack.badges ?? []

  return (
    <section>
      <h2>Skills & Policies</h2>
      <p>Equip boosts earned from streaks to reinforce your preferred play style.</p>
      <div className="meter-overview">
        {Object.entries(defaultMeters).map(([meter, value]) => (
          <div key={meter} className="meter-pill">
            <span>{meter}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <ul className="card-grid">
        {skills.length > 0 ? (
          skills.map((skill) => (
            <li key={skill.id} className="card">
              <h3>{skill.name}</h3>
              <p>{skill.description}</p>
              <p className="small-print">{skill.effects.join(' · ')}</p>
            </li>
          ))
        ) : (
          <li className="card">No skills configured for this content pack yet.</li>
        )}
      </ul>
      {badges.length > 0 ? (
        <div className="card">
          <h3>Badge rewards</h3>
          <ul>
            {badges.map((badge) => (
              <li key={badge.id}>
                <strong>{badge.name}:</strong> {badge.description}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="small-print">
        Packs loaded: <strong>{pack.title}</strong> ({pack.events.length} events)
      </p>
    </section>
  )
}

export default SkillsPage
