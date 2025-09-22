import { defaultMeters } from '../core/scoring'
import { createSeededRNG } from '../utils/rand'

const AnalyticsPage = () => {
  const rng = createSeededRNG(42)
  const projected = Object.entries(defaultMeters).map(([meter, value]) => ({
    meter,
    projected: Math.min(100, Math.round(value + rng() * 10 - 5)),
  }))

  return (
    <section>
      <h2>Analytics</h2>
      <p>Projected meter outcomes if you maintain the current streak.</p>
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Meter</th>
            <th scope="col">Current</th>
            <th scope="col">Projected</th>
          </tr>
        </thead>
        <tbody>
          {projected.map((row) => (
            <tr key={row.meter}>
              <th scope="row">{row.meter}</th>
              <td>{defaultMeters[row.meter as keyof typeof defaultMeters]}</td>
              <td>{row.projected}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default AnalyticsPage
