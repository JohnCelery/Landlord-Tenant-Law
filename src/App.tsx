import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
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
import { loadSave } from './core/saves'
import './App.css'

const App = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => resolveInitialTheme())
  const [meters] = useState(() => loadSave().meters)

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

  return (
    <Layout theme={theme} onThemeChange={setTheme} meters={meters}>
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
    </Layout>
  )
}

export default App
