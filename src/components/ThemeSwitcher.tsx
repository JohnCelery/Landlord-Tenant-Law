import type { ThemeMode } from '../utils/a11y'

interface ThemeSwitcherProps {
  theme: ThemeMode
  onChange: (theme: ThemeMode) => void
}

const options: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'high-contrast', label: 'High contrast' },
]

const ThemeSwitcher = ({ theme, onChange }: ThemeSwitcherProps) => {
  return (
    <label className="theme-switcher">
      <span className="theme-switcher__label">Theme</span>
      <select
        value={theme}
        onChange={(event) => onChange(event.target.value as ThemeMode)}
        aria-label="Select color theme"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default ThemeSwitcher
