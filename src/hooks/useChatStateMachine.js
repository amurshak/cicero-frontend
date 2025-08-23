import { useReducer, useCallback } from 'react';

// Hierarchical States - Separated Connection and Conversation
export const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'connection_error'
};

export const CONVERSATION_STATES = {
  IDLE: 'idle',                    // Ready for input
  SENDING: 'sending',               // Message sent, waiting for acknowledgment
  THINKING: 'thinking',             // Agent is processing (reasoning)
  SEARCHING: 'searching',           // Agent is searching/using tools
  STREAMING: 'streaming',           // Receiving response chunks
  ERROR: 'conversation_error',      // Error occurred
  RATE_LIMITED: 'rate_limited'      // Rate limit reached
};

// Action types
export const CHAT_ACTIONS = {
  // Connection events - Can happen from any state
  CONNECT: 'CONNECT',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // Message flow events - Guarded by connection state
  SEND_MESSAGE: 'SEND_MESSAGE',
  MESSAGE_ACKNOWLEDGED: 'MESSAGE_ACKNOWLEDGED',
  
  // Response events
  START_THINKING: 'START_THINKING',
  START_SEARCHING: 'START_SEARCHING',
  START_STREAMING: 'START_STREAMING',
  RESPONSE_COMPLETE: 'RESPONSE_COMPLETE',
  
  // Error events
  CONVERSATION_ERROR: 'CONVERSATION_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Reset
  RESET: 'RESET'
};

// Initial state - Hierarchical structure
const initialState = {
  connection: CONNECTION_STATES.CONNECTING,
  conversation: CONVERSATION_STATES.IDLE,
  error: null,
  metadata: {}
};

// Connection state transitions - Can happen from any conversation state
const connectionTransitions = {
  [CONNECTION_STATES.DISCONNECTED]: {
    [CHAT_ACTIONS.CONNECT]: CONNECTION_STATES.CONNECTING,
    [CHAT_ACTIONS.CONNECTED]: CONNECTION_STATES.CONNECTED
  },
  [CONNECTION_STATES.CONNECTING]: {
    [CHAT_ACTIONS.CONNECTED]: CONNECTION_STATES.CONNECTED,
    [CHAT_ACTIONS.CONNECTION_ERROR]: CONNECTION_STATES.ERROR,
    [CHAT_ACTIONS.DISCONNECTED]: CONNECTION_STATES.DISCONNECTED
  },
  [CONNECTION_STATES.CONNECTED]: {
    [CHAT_ACTIONS.CONNECTED]: CONNECTION_STATES.CONNECTED, // Allow idempotent connected calls
    [CHAT_ACTIONS.DISCONNECTED]: CONNECTION_STATES.DISCONNECTED,
    [CHAT_ACTIONS.CONNECTION_ERROR]: CONNECTION_STATES.ERROR
  },
  [CONNECTION_STATES.ERROR]: {
    [CHAT_ACTIONS.CONNECT]: CONNECTION_STATES.CONNECTING,
    [CHAT_ACTIONS.CONNECTED]: CONNECTION_STATES.CONNECTED
  }
};

// Conversation state transitions - Only valid when connected
const conversationTransitions = {
  [CONVERSATION_STATES.IDLE]: {
    [CHAT_ACTIONS.SEND_MESSAGE]: CONVERSATION_STATES.SENDING
  },
  [CONVERSATION_STATES.SENDING]: {
    [CHAT_ACTIONS.MESSAGE_ACKNOWLEDGED]: CONVERSATION_STATES.THINKING,
    [CHAT_ACTIONS.START_THINKING]: CONVERSATION_STATES.THINKING,
    [CHAT_ACTIONS.RESPONSE_COMPLETE]: CONVERSATION_STATES.IDLE, // Allow direct completion for cached responses
    [CHAT_ACTIONS.CONVERSATION_ERROR]: CONVERSATION_STATES.ERROR,
    [CHAT_ACTIONS.RATE_LIMIT]: CONVERSATION_STATES.RATE_LIMITED
  },
  [CONVERSATION_STATES.THINKING]: {
    [CHAT_ACTIONS.START_SEARCHING]: CONVERSATION_STATES.SEARCHING,
    [CHAT_ACTIONS.START_STREAMING]: CONVERSATION_STATES.STREAMING,
    [CHAT_ACTIONS.RESPONSE_COMPLETE]: CONVERSATION_STATES.IDLE, // Allow direct completion without streaming
    [CHAT_ACTIONS.CONVERSATION_ERROR]: CONVERSATION_STATES.ERROR
  },
  [CONVERSATION_STATES.SEARCHING]: {
    [CHAT_ACTIONS.START_THINKING]: CONVERSATION_STATES.THINKING,
    [CHAT_ACTIONS.START_STREAMING]: CONVERSATION_STATES.STREAMING,
    [CHAT_ACTIONS.RESPONSE_COMPLETE]: CONVERSATION_STATES.IDLE, // Allow direct completion without streaming
    [CHAT_ACTIONS.CONVERSATION_ERROR]: CONVERSATION_STATES.ERROR
  },
  [CONVERSATION_STATES.STREAMING]: {
    [CHAT_ACTIONS.RESPONSE_COMPLETE]: CONVERSATION_STATES.IDLE,
    [CHAT_ACTIONS.CONVERSATION_ERROR]: CONVERSATION_STATES.ERROR
  },
  [CONVERSATION_STATES.ERROR]: {
    [CHAT_ACTIONS.CLEAR_ERROR]: CONVERSATION_STATES.IDLE
  },
  [CONVERSATION_STATES.RATE_LIMITED]: {
    [CHAT_ACTIONS.CLEAR_ERROR]: CONVERSATION_STATES.IDLE,
    [CHAT_ACTIONS.RATE_LIMIT]: CONVERSATION_STATES.RATE_LIMITED // Allow idempotent rate limit
  }
};

// Guard conditions
const canSendMessage = (connection, conversation) => {
  return connection === CONNECTION_STATES.CONNECTED && conversation === CONVERSATION_STATES.IDLE;
};

const canProcessConversationEvent = (connection) => {
  return connection === CONNECTION_STATES.CONNECTED;
};

// Reducer function - Hierarchical state management
function chatReducer(state, action) {
  const { connection, conversation } = state;

  // Log state transitions for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[ChatStateMachine] Connection: ${connection}, Conversation: ${conversation} + ${action.type}`);
  }

  // Handle RESET action - always allowed
  if (action.type === CHAT_ACTIONS.RESET) {
    return { 
      ...initialState,
      connection: state.connection // Keep current connection state on reset
    };
  }

  // Handle connection events - these can happen from any state
  if ([CHAT_ACTIONS.CONNECT, CHAT_ACTIONS.CONNECTED, CHAT_ACTIONS.DISCONNECTED, CHAT_ACTIONS.CONNECTION_ERROR].includes(action.type)) {
    const connectionTransitionMap = connectionTransitions[connection] || {};
    const nextConnection = connectionTransitionMap[action.type];
    
    if (nextConnection) {
      const newState = {
        ...state,
        connection: nextConnection,
        // Reset conversation to IDLE on disconnect
        conversation: action.type === CHAT_ACTIONS.DISCONNECTED ? CONVERSATION_STATES.IDLE : conversation,
        error: action.type === CHAT_ACTIONS.CONNECTION_ERROR ? action.payload : state.error
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ChatStateMachine] Connection: ${connection} → ${nextConnection}`);
      }
      
      return newState;
    } else {
      console.warn(`[ChatStateMachine] Invalid connection transition: ${connection} cannot handle ${action.type}`);
      return state;
    }
  }

  // Handle conversation events - only valid when connected
  const conversationTransitionMap = conversationTransitions[conversation] || {};
  const nextConversation = conversationTransitionMap[action.type];

  if (nextConversation) {
    // Check guard conditions for message sending
    if (action.type === CHAT_ACTIONS.SEND_MESSAGE && !canSendMessage(connection, conversation)) {
      console.warn(`[ChatStateMachine] Cannot send message: connection=${connection}, conversation=${conversation}`);
      return state;
    }

    // Check guard conditions for other conversation events
    if (!canProcessConversationEvent(connection) && 
        ![CHAT_ACTIONS.CLEAR_ERROR].includes(action.type)) {
      console.warn(`[ChatStateMachine] Cannot process conversation event when disconnected: ${action.type}`);
      return state;
    }

    const newState = {
      ...state,
      conversation: nextConversation,
      error: [CHAT_ACTIONS.CONVERSATION_ERROR, CHAT_ACTIONS.RATE_LIMIT].includes(action.type) 
        ? action.payload 
        : action.type === CHAT_ACTIONS.CLEAR_ERROR 
          ? null 
          : state.error,
      metadata: action.payload || state.metadata
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(`[ChatStateMachine] Conversation: ${conversation} → ${nextConversation}`);
    }

    return newState;
  }

  // Invalid transition
  console.warn(`[ChatStateMachine] Invalid conversation transition: ${conversation} cannot handle ${action.type}`);
  return state;
}

// Custom hook
export function useChatStateMachine() {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Helper functions for connection transitions
  const connect = useCallback(() => dispatch({ type: CHAT_ACTIONS.CONNECT }), []);
  const connected = useCallback(() => dispatch({ type: CHAT_ACTIONS.CONNECTED }), []);
  const disconnect = useCallback(() => dispatch({ type: CHAT_ACTIONS.DISCONNECTED }), []);
  const connectionError = useCallback((error) => dispatch({ type: CHAT_ACTIONS.CONNECTION_ERROR, payload: error }), []);
  
  // Helper functions for conversation transitions
  const sendMessage = useCallback(() => dispatch({ type: CHAT_ACTIONS.SEND_MESSAGE }), []);
  const messageAcknowledged = useCallback(() => dispatch({ type: CHAT_ACTIONS.MESSAGE_ACKNOWLEDGED }), []);
  const startThinking = useCallback(() => dispatch({ type: CHAT_ACTIONS.START_THINKING }), []);
  const startSearching = useCallback(() => dispatch({ type: CHAT_ACTIONS.START_SEARCHING }), []);
  const startStreaming = useCallback(() => dispatch({ type: CHAT_ACTIONS.START_STREAMING }), []);
  const responseComplete = useCallback(() => dispatch({ type: CHAT_ACTIONS.RESPONSE_COMPLETE }), []);
  
  // Error handling
  const setError = useCallback((error) => dispatch({ type: CHAT_ACTIONS.CONVERSATION_ERROR, payload: error }), []);
  const setRateLimit = useCallback((info) => dispatch({ type: CHAT_ACTIONS.RATE_LIMIT, payload: info }), []);
  const clearError = useCallback(() => dispatch({ type: CHAT_ACTIONS.CLEAR_ERROR }), []);
  const reset = useCallback(() => dispatch({ type: CHAT_ACTIONS.RESET }), []);

  // Computed properties using hierarchical states
  const canSendMessage = state.connection === CONNECTION_STATES.CONNECTED && 
                        state.conversation === CONVERSATION_STATES.IDLE;
  const isProcessing = [
    CONVERSATION_STATES.SENDING,
    CONVERSATION_STATES.THINKING,
    CONVERSATION_STATES.SEARCHING,
    CONVERSATION_STATES.STREAMING
  ].includes(state.conversation);
  const isConnected = state.connection === CONNECTION_STATES.CONNECTED;
  const isConnecting = state.connection === CONNECTION_STATES.CONNECTING;
  const hasError = state.conversation === CONVERSATION_STATES.ERROR || 
                   state.conversation === CONVERSATION_STATES.RATE_LIMITED ||
                   state.connection === CONNECTION_STATES.ERROR;

  return {
    // Hierarchical State
    connection: state.connection,
    conversation: state.conversation,
    error: state.error,
    metadata: state.metadata,
    
    // Computed properties
    canSendMessage,
    isProcessing,
    isConnected,
    isConnecting,
    hasError,
    
    // Connection transition functions
    connect,
    connected,
    disconnect,
    connectionError,
    
    // Conversation transition functions
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
    dispatch,
    
    // Legacy compatibility (for easier migration)
    state: state.conversation,
    isConnected: isConnected
  };
}

export default useChatStateMachine;