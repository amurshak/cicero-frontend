import React, { createContext, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { initPostHog, trackPageView } from '../services/posthog';

// Initialize PostHog
const posthogClient = initPostHog();

// Create context for any custom PostHog utilities
const PostHogContext = createContext(null);

export const PostHogProvider = ({ children }) => {
  const location = useLocation();

  // Track page views on route change
  useEffect(() => {
    if (posthogClient) {
      // Extract page name from pathname
      const pageName = location.pathname === '/' 
        ? 'Home' 
        : location.pathname.slice(1).replace(/\//g, ' > ').replace(/^\w/, c => c.toUpperCase());
      
      trackPageView(pageName, {
        referrer: document.referrer,
        search: location.search,
      });
    }
  }, [location]);

  // If PostHog is not configured, just render children
  if (!posthogClient) {
    return <>{children}</>;
  }

  // Wrap with PostHog's official React provider
  return (
    <PHProvider client={posthogClient}>
      <PostHogContext.Provider value={{ posthogClient }}>
        {children}
      </PostHogContext.Provider>
    </PHProvider>
  );
};

// Custom hook for accessing PostHog context
export const usePostHogContext = () => {
  const context = useContext(PostHogContext);
  if (!context && import.meta.env.VITE_POSTHOG_KEY) {
    console.warn('usePostHogContext must be used within PostHogProvider');
  }
  return context;
};