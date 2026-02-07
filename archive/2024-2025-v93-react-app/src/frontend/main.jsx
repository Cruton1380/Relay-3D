/**
 * ⚠️ CANONICAL FRONTEND ENTRY POINT ⚠️
 * 
 * This is the ONLY main.jsx file in the project.
 * Referenced by: /index.html line 34
 * 
 * DO NOT create duplicate main.jsx or App.jsx files.
 * Run `npm run verify:entry` to check for duplicates.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
