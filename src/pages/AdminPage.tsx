import { useState } from 'react'
import { usePacks } from '../data/packs'
import { createInitialSave, loadSave, persistSave } from '../core/saves'

const AdminPage = () => {
  const [saveData, setSaveData] = useState(() => loadSave())
  const [packUrl, setPackUrl] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const { packs, activePackId, status, error, importPack, selectPack } = usePacks()

  const handleImport = async () => {
    if (!packUrl) {
      return
    }

    try {
      const pack = await importPack(packUrl)
      setMessage(`Imported ${pack.title} (${pack.version})`)
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : 'Unknown error'
      setMessage(`Import failed: ${detail}`)
    } finally {
      setPackUrl('')
    }
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
        <p>Status: {status}</p>
        {error ? <p className="small-print">Last error: {error}</p> : null}
        {message ? <p className="small-print">{message}</p> : null}
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
        <button type="button" onClick={handleImport} disabled={!packUrl || status === 'loading'}>
          Import pack
        </button>
      </div>

      <div className="card">
        <h3>Loaded packs</h3>
        {packs.length > 0 ? (
          <ul>
            {packs.map((pack) => (
              <li key={pack.id}>
                <button
                  type="button"
                  className={pack.id === activePackId ? 'badge' : 'link'}
                  onClick={() => selectPack(pack.id)}
                >
                  {pack.title} ({pack.version})
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No packs loaded.</p>
        )}
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
