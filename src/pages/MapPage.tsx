import { corePack } from '../data/packs'
import { assetCatalog } from '../data/assets'

const MapPage = () => {
  return (
    <section>
      <h2>Campaign Map</h2>
      <p>Select a building to focus on a specific regulatory topic.</p>
      <ul className="card-grid">
        {corePack.topics.map((topic) => (
          <li key={topic} className="card">
            <h3>{topic}</h3>
            <p>Practice events tied to {topic} obligations and best practices.</p>
          </li>
        ))}
      </ul>
      <p className="small-print">
        Missing art slots? Compare against the catalog:
        <strong> {assetCatalog.length}</strong> required slots defined.
      </p>
    </section>
  )
}

export default MapPage
