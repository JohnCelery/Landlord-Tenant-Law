export type ThemeMode = 'light' | 'dark' | 'high-contrast'

const THEME_STORAGE_KEY = 'gsm.theme-preference'

export const resolveInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null

  if (stored === 'light' || stored === 'dark' || stored === 'high-contrast') {
    return stored
  }

  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

export const persistTheme = (theme: ThemeMode) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export const applyThemeToDocument = (theme: ThemeMode) => {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.theme = theme
}

export const subscribeToSystemTheme = (
  callback: (mode: Extract<ThemeMode, 'light' | 'dark'>) => void,
) => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {}
  }

  const query = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (event: MediaQueryListEvent) => {
    callback(event.matches ? 'dark' : 'light')
  }

  query.addEventListener('change', handler)

  return () => query.removeEventListener('change', handler)
}

export const focusElement = (element: HTMLElement | null) => {
  if (!element) {
    return
  }

  element.focus({ preventScroll: false })
}

export const createAriaAnnouncer = () => {
  if (typeof document === 'undefined') {
    return { announce: () => {} }
  }

  const region = document.createElement('div')
  region.setAttribute('aria-live', 'polite')
  region.setAttribute('aria-atomic', 'true')
  region.className = 'sr-only'
  document.body.append(region)

  return {
    announce(message: string) {
      region.textContent = message
    },
  }
}
