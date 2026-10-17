import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './services/cloudApiService.js'

// Console Banner for Chrome DevTools Inspect & Debugging
console.log(
  '%c🚀 InfraPulse Cloud Management Platform Active%c\n' +
  '• Inspect elements to see data-function="cloud...Function"\n' +
  '• Type "cloudFunction.help()" or "cloudServices" to run cloud functions directly\n' +
  '• Real-time network calls dispatched to /api/v1/cloud/*',
  'background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 13px;',
  'color: #38bdf8; font-size: 11px; line-height: 1.6;'
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

