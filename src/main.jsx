import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import { PostHogProvider } from 'posthog-js/react'

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: '2025-05-24',
  capture_pageview: false, // We handle pageviews manually
  capture_pageleave: true,
  persistence: 'localStorage+cookie',
  session_recording: {
    maskAllInputs: false,
    maskInputOptions: { password: true }
  },
  person_profiles: 'identified_only',
  loaded: (posthog) => {
    if (import.meta.env.DEV) {
      console.log('PostHog loaded successfully');
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PostHogProvider 
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} 
      options={options}
    >
      <App />
    </PostHogProvider>
  </React.StrictMode>,
)