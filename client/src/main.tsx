import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
// Self-hosted variable fonts (CSP-safe): Anuphan covers Thai + Latin with a
// soft geometric look; Noto Sans JP fills in the Japanese glyphs.
import '@fontsource-variable/anuphan/index.css'
import '@fontsource-variable/noto-sans-jp/index.css'
import './index.css'
import './i18n'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
