import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { I18nProvider } from './i18n/index.tsx'

// Note: StrictMode disabled due to Cytoscape.js incompatibility with double-mounting
// This only affects development - production builds don't use StrictMode anyway
createRoot(document.getElementById('root')!).render(
  <I18nProvider>
    <App />
  </I18nProvider>,
)
