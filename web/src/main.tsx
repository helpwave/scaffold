import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HightideProvider } from '@helpwave/hightide'
import '@helpwave/hightide/style/globals.css'
import './index.css'
import { ScaffoldTranslationProvider } from './i18n/ScaffoldTranslationContext'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <HightideProvider>
            <ScaffoldTranslationProvider>
                <App />
            </ScaffoldTranslationProvider>
        </HightideProvider>
    </StrictMode>
)
