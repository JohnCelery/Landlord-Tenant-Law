import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import Layout from './components/Layout'
import {
  AdminPage,
  AnalyticsPage,
  BossPage,
  DailyPage,
  MapPage,
  NotFoundPage,
  NoticePage,
  PracticePage,
  RunPage,
  SettingsPage,
  SkillsPage,
} from './pages'
import {
  applyThemeToDocument,
  persistTheme,
  resolveInitialTheme,
  subscribeToSystemTheme,
  type ThemeMode,
} from './utils/a11y'
import { usePacks } from './data/packs'
import { useCampaignState } from './core/campaign'
import './App.css'

const App = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => resolveInitialTheme())
  const { status, error, activePack } = usePacks()
  const { meters } = useCampaignState()

  useEffect(() => {
    applyThemeToDocument(theme)
    persistTheme(theme)
  }, [theme])

  useEffect(() => {
    const unsubscribe = subscribeToSystemTheme((systemTheme) => {
      setTheme((current) => (current === 'high-contrast' ? current : systemTheme))
    })

    return unsubscribe
  }, [])

  const content = useMemo(() => {
    if (status === 'loading') {
      return (
        <section>
          <h2>Loading content packs…</h2>
          <p>Please wait while we prepare your training data.</p>
        </section>
      )
    }

    if (!activePack) {
      return (
        <section>
          <h2>Unable to load content</h2>
          <p>{error ?? 'The requested pack could not be loaded.'}</p>
        </section>
      )
    }

    return (
      <Routes>
        <Route path="/" element={<Navigate to="/map" replace />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/run" element={<RunPage />} />
        <Route path="/daily" element={<DailyPage />} />
        <Route path="/boss/:id" element={<BossPage />} />
        <Route path="/notice/:id" element={<NoticePage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    )
  }, [status, activePack, error])

  return (
    <Layout theme={theme} onThemeChange={setTheme} meters={meters}>
      {content}
    </Layout>
  )
}

export default App
