import { corePack } from '../data/packs'
import { defaultMeters } from '../core/scoring'

const skillCards = [
  { id: 'policy-tracker', title: 'Policy Tracker', effect: '+Compliance, +Trust' },
  { id: 'rapid-reply', title: 'Rapid Reply', effect: '-Risk, +Trust' },
  { id: 'rent-modeler', title: 'Rent Modeler', effect: '+ROI' },
]

const SkillsPage = () => {
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
        {skillCards.map((skill) => (
          <li key={skill.id} className="card">
            <h3>{skill.title}</h3>
            <p>{skill.effect}</p>
          </li>
        ))}
      </ul>
      <p className="small-print">
        Packs loaded: <strong>{corePack.title}</strong> ({corePack.events.length} events)
      </p>
    </section>
  )
}

export default SkillsPage
