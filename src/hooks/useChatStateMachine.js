import { useReducer, useCallback } from 'react';

// Chat states - mutually exclusive
export const CHAT_STATES = {
  IDLE: 'idle',                    // Ready for input
  CONNECTING: 'connecting',         // WebSocket connecting
  SENDING: 'sending',               // Message sent, waiting for acknowledgment
  THINKING: 'thinking',             // Agent is processing (reasoning)
  SEARCHING: 'searching',           // Agent is searching/using tools
  STREAMING: 'streaming',           // Receiving response chunks
  ERROR: 'error',                   // Error occurred
  RATE_LIMITED: 'rate_limited',     // Rate limit reached
  DISCONNECTED: 'disconnected'      // WebSocket disconnected
};

// Action types
export const CHAT_ACTIONS = {
  // Connection events
  CONNECT: 'CONNECT',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  
  // Message flow events
  SEND_MESSAGE: 'SEND_MESSAGE',
  MESSAGE_ACKNOWLEDGED: 'MESSAGE_ACKNOWLEDGED',
  
  // Response events
  START_THINKING: 'START_THINKING',
  START_SEARCHING: 'START_SEARCHING',
  START_STREAMING: 'START_STREAMING',
  RESPONSE_COMPLETE: 'RESPONSE_COMPLETE',
  
  // Error events
  ERROR: 'ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Reset
  RESET: 'RESET'
};

// Initial state
const initialState = {
  currentState: CHAT_STATES.CONNECTING,
  previousState: null,
  error: null,
  metadata: {}
};

// State machine transition rules
const transitions = {
  [CHAT_STATES.IDLE]: {
    [CHAT_ACTIONS.SEND_MESSAGE]: CHAT_STATES.SENDING,
    [CHAT_ACTIONS.DISCONNECTED]: CHAT_STATES.DISCONNECTED,
    [CHAT_ACTIONS.ERROR]: CHAT_STATES.ERROR
  },
  [CHAT_STATES.CONNECTING]: {
    [CHAT_ACTIONS.CONNECTED]: CHAT_STATES.IDLE,
    [CHAT_ACTIONS.ERROR]: CHAT_STATES.ERROR
  },
  [CHAT_STATES.SENDING]: {
    [CHAT_ACTIONS.MESSAGE_ACKNOWLEDGED]: CHAT_STATES.THINKING,
    [CHAT_ACTIONS.START_THINKING]: CHAT_STATES.THINKING,
    [CHAT_ACTIONS.ERROR]: CHAT_STATES.ERROR,
    [CHAT_ACTIONS.RATE_LIMIT]: CHAT_STATES.RATE_LIMITED,
    [CHAT_ACTIONS.DISCONNECTED]: CHAT_STATES.DISCONNECTED
  },
  [CHAT_STATES.THINKING]: {
    [CHAT_ACTIONS.START_SEARCHING]: CHAT_STATES.SEARCHING,
    [CHAT_ACTIONS.START_STREAMING]: CHAT_STATES.STREAMING,
    [CHAT_ACTIONS.ERROR]: CHAT_STATES.ERROR,
    [CHAT_ACTIONS.DISCONNECTED]: CHAT_STATES.DISCONNECTED
  },
  [CHAT_STATES.SEARCHING]: {
    [CHAT_ACTIONS.START_THINKING]: CHAT_STATES.THINKING,
    [CHAT_ACTIONS.START_STREAMING]: CHAT_STATES.STREAMING,
    [CHAT_ACTIONS.ERROR]: CHAT_STATES.ERROR,
    [CHAT_ACTIONS.DISCONNECTED]: CHAT_STATES.DISCONNECTED
  },
  [CHAT_STATES.STREAMING]: {
    [CHAT_ACTIONS.RESPONSE_COMPLETE]: CHAT_STATES.IDLE,
    [CHAT_ACTIONS.ERROR]: CHAT_STATES.ERROR,
    [CHAT_ACTIONS.DISCONNECTED]: CHAT_STATES.DISCONNECTED
  },
  [CHAT_STATES.ERROR]: {
    [CHAT_ACTIONS.CLEAR_ERROR]: CHAT_STATES.IDLE,
    [CHAT_ACTIONS.CONNECTED]: CHAT_STATES.IDLE,
    [CHAT_ACTIONS.RESET]: CHAT_STATES.IDLE
  },
  [CHAT_STATES.RATE_LIMITED]: {
    [CHAT_ACTIONS.CLEAR_ERROR]: CHAT_STATES.IDLE,
    [CHAT_ACTIONS.RESET]: CHAT_STATES.IDLE
  },
  [CHAT_STATES.DISCONNECTED]: {
    [CHAT_ACTIONS.CONNECT]: CHAT_STATES.CONNECTING,
    [CHAT_ACTIONS.CONNECTED]: CHAT_STATES.IDLE
  }
};

// Reducer function
function chatReducer(state, action) {
  const { currentState } = state;
  const allowedTransitions = transitions[currentState] || {};
  const nextState = allowedTransitions[action.type];

  // Log state transitions for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[ChatStateMachine] ${currentState} + ${action.type} → ${nextState || 'INVALID'}`);
  }

  // If transition is not allowed, log warning and return current state
  if (!nextState && action.type !== CHAT_ACTIONS.RESET) {
    console.warn(`[ChatStateMachine] Invalid transition: ${currentState} cannot handle ${action.type}`);
    return state;
  }

  // Handle RESET action specially - always allowed
  if (action.type === CHAT_ACTIONS.RESET) {
    return initialState;
  }

  // Update state
  return {
    currentState: nextState,
    previousState: currentState,
    error: action.type === CHAT_ACTIONS.ERROR || action.type === CHAT_ACTIONS.RATE_LIMIT 
      ? action.payload 
      : action.type === CHAT_ACTIONS.CLEAR_ERROR 
        ? null 
        : state.error,
    metadata: action.payload || state.metadata
  };
}

// Custom hook
export function useChatStateMachine() {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Helper functions for common transitions
  const connect = useCallback(() => dispatch({ type: CHAT_ACTIONS.CONNECT }), []);
  const connected = useCallback(() => dispatch({ type: CHAT_ACTIONS.CONNECTED }), []);
  const disconnect = useCallback(() => dispatch({ type: CHAT_ACTIONS.DISCONNECTED }), []);
  
  const sendMessage = useCallback(() => dispatch({ type: CHAT_ACTIONS.SEND_MESSAGE }), []);
  const messageAcknowledged = useCallback(() => dispatch({ type: CHAT_ACTIONS.MESSAGE_ACKNOWLEDGED }), []);
  
  const startThinking = useCallback(() => dispatch({ type: CHAT_ACTIONS.START_THINKING }), []);
  const startSearching = useCallback(() => dispatch({ type: CHAT_ACTIONS.START_SEARCHING }), []);
  const startStreaming = useCallback(() => dispatch({ type: CHAT_ACTIONS.START_STREAMING }), []);
  const responseComplete = useCallback(() => dispatch({ type: CHAT_ACTIONS.RESPONSE_COMPLETE }), []);
  
  const setError = useCallback((error) => dispatch({ type: CHAT_ACTIONS.ERROR, payload: error }), []);
  const setRateLimit = useCallback((info) => dispatch({ type: CHAT_ACTIONS.RATE_LIMIT, payload: info }), []);
  const clearError = useCallback(() => dispatch({ type: CHAT_ACTIONS.CLEAR_ERROR }), []);
  
  const reset = useCallback(() => dispatch({ type: CHAT_ACTIONS.RESET }), []);

  // Computed properties
  const canSendMessage = state.currentState === CHAT_STATES.IDLE;
  const isProcessing = [
    CHAT_STATES.SENDING,
    CHAT_STATES.THINKING,
    CHAT_STATES.SEARCHING,
    CHAT_STATES.STREAMING
  ].includes(state.currentState);
  const isConnected = state.currentState !== CHAT_STATES.CONNECTING && 
                     state.currentState !== CHAT_STATES.DISCONNECTED;
  const hasError = state.currentState === CHAT_STATES.ERROR || 
                   state.currentState === CHAT_STATES.RATE_LIMITED;

  return {
    // State
    state: state.currentState,
    previousState: state.previousState,
    error: state.error,
    metadata: state.metadata,
    
    // Computed properties
    canSendMessage,
    isProcessing,
    isConnected,
    hasError,
    
    // State transition functions
    connect,
    connected,
    disconnect,
    sendMessage,
    messageAcknowledged,
    startThinking,
    startSearching,
    startStreaming,
    responseComplete,
    setError,
    setRateLimit,
    clearError,
    reset,
    
    // Raw dispatch for custom actions
    dispatch
  };
}

export default useChatStateMachine;