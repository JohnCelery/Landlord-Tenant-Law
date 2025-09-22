import { useState } from 'react'
import { createInitialSave, loadSave, persistSave } from '../core/saves'

const AdminPage = () => {
  const [saveData, setSaveData] = useState(() => loadSave())
  const [packUrl, setPackUrl] = useState('')

  const handleImport = () => {
    if (!packUrl) {
      return
    }

    console.info('Simulating pack import from', packUrl)
    setPackUrl('')
  }

  const handleReset = () => {
    const reset = createInitialSave()
    persistSave(reset)
    setSaveData(reset)
  }

  return (
    <section>
      <h2>Admin Console</h2>
      <p>Manage packs, saves, and debug data for the training environment.</p>
      <div className="card">
        <h3>Import pack</h3>
        <div className="form-row">
          <label htmlFor="pack-url">Pack URL</label>
          <input
            id="pack-url"
            type="url"
            value={packUrl}
            onChange={(event) => setPackUrl(event.target.value)}
            placeholder="https://example.com/core.pack.json"
          />
        </div>
        <button type="button" onClick={handleImport} disabled={!packUrl}>
          Import pack
        </button>
      </div>

      <div className="card">
        <h3>Save state</h3>
        <pre className="code-block">{JSON.stringify(saveData, null, 2)}</pre>
        <button type="button" className="secondary" onClick={handleReset}>
          Reset progress
        </button>
      </div>
    </section>
  )
}

export default AdminPage
