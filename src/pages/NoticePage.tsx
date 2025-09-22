import { useParams } from 'react-router-dom'
import { useActivePack } from '../data/packs'
import { toCSV } from '../utils/csv'

const NoticePage = () => {
  const { id } = useParams<{ id: string }>()
  const pack = useActivePack()
  const rules = pack.noticeRules.slice(0, 5)
  const csvPreview = toCSV([
    ['Ground', 'Cease required', 'Quit timing', 'Service options'],
    ...rules.map((rule) => [
      rule.ground,
      rule.ceaseRequired ? 'Yes' : 'No',
      rule.quitTiming,
      rule.serviceOptions.join(' | '),
    ]),
  ])

  return (
    <section>
      <h2>Notice Builder Rules</h2>
      <p>
        Loaded pack: <strong>{pack.title}</strong> ({pack.noticeRules.length} total notice rules)
      </p>
      <p>Loaded notice id: {id}</p>
      <pre className="code-block" aria-label="CSV preview">
        {csvPreview}
      </pre>
    </section>
  )
}

export default NoticePage
