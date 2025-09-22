import { useState } from 'react'
import { createAriaAnnouncer } from '../utils/a11y'

const announcer = createAriaAnnouncer()

const SettingsPage = () => {
  const [motion, setMotion] = useState<'full' | 'reduced'>('full')
  const [notifications, setNotifications] = useState(false)

  const handleMotionChange = (value: 'full' | 'reduced') => {
    setMotion(value)
    announcer.announce(
      `Motion preference set to ${value === 'full' ? 'full motion' : 'reduced motion'}`,
    )
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
      </form>
    </section>
  )
}

export default SettingsPage
