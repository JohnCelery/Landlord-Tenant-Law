import type { ChangeEvent } from 'react'
import { useRef, useState } from 'react'
import { createAriaAnnouncer } from '../utils/a11y'
import { type GameStateSnapshot, useGameState } from '../core/gameState'

const announcer = createAriaAnnouncer()

const SettingsPage = () => {
  const [motion, setMotion] = useState<'full' | 'reduced'>('full')
  const [notifications, setNotifications] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const { runId, runSeed, saveToStorage, restoreFromStorage, createSnapshot, loadSnapshot } =
    useGameState((state) => ({
      runId: state.runId,
      runSeed: state.runSeed,
      saveToStorage: state.saveToStorage,
      restoreFromStorage: state.restoreFromStorage,
      createSnapshot: state.createSnapshot,
      loadSnapshot: state.loadSnapshot,
    }))

  const handleMotionChange = (value: 'full' | 'reduced') => {
    setMotion(value)
    announcer.announce(
      `Motion preference set to ${value === 'full' ? 'full motion' : 'reduced motion'}`,
    )
  }

  const handleSave = () => {
    const saved = saveToStorage()
    announcer.announce(saved ? 'Progress saved locally.' : 'Unable to save your progress.')
  }

  const handleLoad = () => {
    const restored = restoreFromStorage()
    announcer.announce(restored ? 'Progress loaded from local storage.' : 'No save data found.')
  }

  const handleExport = () => {
    const snapshot = createSnapshot()
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const filename = `garden-state-run-${snapshot.runId || snapshot.runSeed}.json`

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    announcer.announce('Save file downloaded.')
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const contents = await file.text()
      const parsed = JSON.parse(contents) as GameStateSnapshot
      loadSnapshot(parsed)
      announcer.announce('Save file imported successfully.')
    } catch (error) {
      console.error('Failed to import save file', error)
      announcer.announce('Import failed. Please verify the file and try again.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <section>
      <h2>Settings</h2>
      <form className="settings-form">
        <fieldset>
          <legend>Accessibility</legend>
          <label>
            <input
              type="radio"
              name="motion"
              value="full"
              checked={motion === 'full'}
              onChange={() => handleMotionChange('full')}
            />
            Full motion
          </label>
          <label>
            <input
              type="radio"
              name="motion"
              value="reduced"
              checked={motion === 'reduced'}
              onChange={() => handleMotionChange('reduced')}
            />
            Reduced motion
          </label>
        </fieldset>

        <fieldset>
          <legend>Notifications</legend>
          <label>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(event) => setNotifications(event.target.checked)}
            />
            Enable update alerts
          </label>
        </fieldset>

        <fieldset>
          <legend>Progress</legend>
          <p className="small-print">
            Current run ID: {runId ? <code>{runId}</code> : 'Not started'} · Seed: {runSeed}
          </p>
          <div className="button-row">
            <button type="button" onClick={handleSave}>
              Save to browser storage
            </button>
            <button type="button" onClick={handleLoad}>
              Load from browser storage
            </button>
            <button type="button" onClick={handleExport}>
              Export save file
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="secondary"
            >
              Import save file
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="visually-hidden"
            onChange={handleImport}
          />
        </fieldset>
      </form>
    </section>
  )
}

export default SettingsPage
