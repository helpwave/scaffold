import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { HightideProvider, useTheme, useLocale } from '@helpwave/hightide'
import './index.css'
import { ScaffoldTranslationProvider } from './i18n/ScaffoldTranslationContext'
import App from './App.tsx'

const THEME_KEY = 'helpwave-scaffold-theme'
const LOCALE_KEY = 'helpwave-scaffold-locale'

const THEMES = ['light', 'dark', 'system'] as const
const LOCALES = ['de-DE', 'en-US'] as const

function getStoredTheme(): 'light' | 'dark' | 'system' {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored && THEMES.includes(stored as (typeof THEMES)[number])) {
    return stored as 'light' | 'dark' | 'system'
  }
  return 'system'
}

function getInitialTheme(): 'light' | 'dark' {
  const stored = getStoredTheme()
  return stored === 'system' ? 'light' : stored
}

function getStoredLocale(): 'de-DE' | 'en-US' {
  const stored = localStorage.getItem(LOCALE_KEY)
  if (stored && LOCALES.includes(stored as (typeof LOCALES)[number])) {
    return stored as 'de-DE' | 'en-US'
  }
  return 'en-US'
}

function PersistThemeLocale({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme()
  const { locale } = useLocale()

  useEffect(() => {
    setTheme(getStoredTheme())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale)
  }, [locale])

  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HightideProvider
      theme={{ initialTheme: getInitialTheme() }}
      locale={{
        defaultLocale: getStoredLocale(),
        onChangedLocale: (locale) => localStorage.setItem(LOCALE_KEY, locale),
      }}
    >
      <PersistThemeLocale>
        <ScaffoldTranslationProvider>
          <App />
        </ScaffoldTranslationProvider>
      </PersistThemeLocale>
    </HightideProvider>
  </StrictMode>
)
