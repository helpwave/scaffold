import { createContext, useContext, type ReactNode } from 'react'
import { useHightideTranslation } from '@helpwave/hightide'
import { scaffoldTranslation } from './translations'

type ScaffoldTranslationKey = keyof (typeof scaffoldTranslation)['en-US']

type ScaffoldTranslationFn = (
  key: ScaffoldTranslationKey,
  values?: Record<string, unknown>
) => string

const ScaffoldTranslationContext = createContext<ScaffoldTranslationFn | null>(null)

const scaffoldExtensions = [scaffoldTranslation] as unknown as Parameters<typeof useHightideTranslation>[0]

export function ScaffoldTranslationProvider({ children }: { children: ReactNode }) {
  const t = useHightideTranslation(scaffoldExtensions) as ScaffoldTranslationFn
  return (
    <ScaffoldTranslationContext.Provider value={t}>
      {children}
    </ScaffoldTranslationContext.Provider>
  )
}

export function useScaffoldTranslation(): ScaffoldTranslationFn {
  const t = useContext(ScaffoldTranslationContext)
  if (!t) {
    throw new Error('useScaffoldTranslation must be used within ScaffoldTranslationProvider')
  }
  return t
}
