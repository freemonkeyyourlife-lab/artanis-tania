import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import AppErrorBoundary from '@/components/AppErrorBoundary'
import '@/index.css'
import { applyLocalTheme, loadActiveTheme } from '@/lib/appTheme'
applyLocalTheme()
loadActiveTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
)