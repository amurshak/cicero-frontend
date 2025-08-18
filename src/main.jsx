import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import { PostHogProvider } from 'posthog-js/react'

// Check if PostHog should be enabled (only if keys are provided)
const isPostHogEnabled = import.meta.env.VITE_PUBLIC_POSTHOG_KEY && 
                        import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  capture_pageview: false, // We handle pageviews manually
  capture_pageleave: false, // Disable to reduce blocked requests
  persistence: 'localStorage+cookie',
  session_recording: {
    maskAllInputs: false,
    maskInputOptions: { password: true }
  },
  person_profiles: 'identified_only',
  // Disable features that trigger automatic requests
  disable_session_recording: true,
  disable_scroll_properties: true,
  disable_web_experiments: true,
  loaded: (posthog) => {
    if (import.meta.env.DEV) {
      console.log('PostHog loaded successfully');
    }
  }
}

// Graceful degradation wrapper
const AppWithAnalytics = () => {
  if (!isPostHogEnabled) {
    if (import.meta.env.DEV) {
      console.log('PostHog disabled - missing environment variables');
    }
    return <App />;
  }

  return (
    <PostHogProvider 
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} 
      options={options}
    >
      <App />
    </PostHogProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWithAnalytics />
  </React.StrictMode>,
)