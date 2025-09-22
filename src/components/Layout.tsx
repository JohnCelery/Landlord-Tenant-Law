import type { PropsWithChildren } from 'react'
import { useMemo } from 'react'
import type { MeterSnapshot } from '../core/scoring'
import { describeOutcome } from '../core/scoring'
import ThemeSwitcher from './ThemeSwitcher'
import Navigation from './Navigation'
import type { ThemeMode } from '../utils/a11y'

interface LayoutProps extends PropsWithChildren {
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  meters: MeterSnapshot
}

const Layout = ({ children, theme, onThemeChange, meters }: LayoutProps) => {
  const summary = useMemo(
    () =>
      describeOutcome(meters, {
        summary: 'Welcome back to Garden State Manager!',
      }),
    [meters],
  )

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Garden State Manager</h1>
          <p className="app-tagline">Scenario training for New Jersey property managers.</p>
        </div>
        <ThemeSwitcher theme={theme} onChange={onThemeChange} />
      </header>

      <div role="status" aria-live="polite" className="app-status">
        <strong>Meters:</strong>
        <span>{summary}</span>
      </div>

      <Navigation />

      <main className="app-main">{children}</main>

      <footer className="app-footer">
        <p>Built with React, Vite, TypeScript, Vitest, and Workbox-powered PWA support.</p>
      </footer>
    </div>
  )
}

export default Layout
