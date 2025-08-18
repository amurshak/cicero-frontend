// Event tracking helpers and constants for PostHog
// Import usePostHog hook in components that need to track events

// Common event names as constants for consistency
export const EVENTS = {
  // Authentication
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN: 'login',
  LOGOUT: 'logout',
  
  // Chat interactions
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  CHAT_RESPONSE_RECEIVED: 'chat_response_received',
  CHAT_ERROR: 'chat_error',
  
  // Navigation
  PAGE_VIEW: 'page_view',
  CONVERSATION_SELECTED: 'conversation_selected',
  
  // Billing
  UPGRADE_CLICKED: 'upgrade_clicked',
  BILLING_PAGE_VIEWED: 'billing_page_viewed',
  SUBSCRIPTION_STARTED: 'subscription_started',
  
  // Rate limiting
  RATE_LIMIT_HIT: 'rate_limit_hit',
  RATE_LIMIT_UPGRADE_PROMPT: 'rate_limit_upgrade_prompt',
};

// Helper functions that work with usePostHog hook
export const trackEvent = (posthog, eventName, properties = {}) => {
  if (!posthog) return;
  
  // Add common properties
  const enrichedProperties = {
    ...properties,
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE,
  };
  
  posthog.capture(eventName, enrichedProperties);
};

// User identification
export const identifyUser = (posthog, userId, userProperties = {}) => {
  if (!posthog) return;
  
  posthog.identify(userId, {
    ...userProperties,
    identified_at: new Date().toISOString(),
  });
};

// Reset user (for logout)
export const resetUser = (posthog) => {
  if (!posthog) return;
  posthog.reset();
};

// Track page views manually
export const trackPageView = (posthog, pageName, properties = {}) => {
  if (!posthog) return;
  
  trackEvent(posthog, EVENTS.PAGE_VIEW, {
    page_name: pageName,
    page_url: window.location.href,
    page_path: window.location.pathname,
    ...properties
  });
};