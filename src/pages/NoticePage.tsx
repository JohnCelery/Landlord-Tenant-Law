import { useParams } from 'react-router-dom'
import { coreNoticeRules } from '../data/notice-rules'
import { toCSV } from '../utils/csv'

const NoticePage = () => {
  const { id } = useParams<{ id: string }>()
  const rules = coreNoticeRules.rules.slice(0, 5)
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
      <p>Current rule set: {coreNoticeRules.title}</p>
      <p>Loaded notice id: {id}</p>
      <pre className="code-block" aria-label="CSV preview">
        {csvPreview}
      </pre>
    </section>
  )
}

export default NoticePage
