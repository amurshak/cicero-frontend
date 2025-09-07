class WebSocketService {
  constructor() {
    this.ws = null;
    this.messageHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnecting = false;
    this.sessionId = this.loadSessionId(); // Load session ID from storage on init
  }

  // Load session ID from browser storage (persists across tab refreshes and reconnections)
  loadSessionId() {
    try {
      const storedSessionId = sessionStorage.getItem('cicero_session_id');
      if (storedSessionId) {
        console.log('🔗 Loaded existing session ID from storage:', storedSessionId);
        return storedSessionId;
      }
    } catch (error) {
      console.warn('Failed to load session ID from storage:', error);
    }
    return null;
  }

  // Save session ID to browser storage
  saveSessionId(sessionId) {
    try {
      if (sessionId) {
        sessionStorage.setItem('cicero_session_id', sessionId);
        console.log('💾 Saved session ID to storage:', sessionId);
      }
    } catch (error) {
      console.warn('Failed to save session ID to storage:', error);
    }
  }

  // Clear session ID from storage (for explicit session end)
  clearSessionId() {
    try {
      sessionStorage.removeItem('cicero_session_id');
      console.log('🗑️ Cleared session ID from storage');
    } catch (error) {
      console.warn('Failed to clear session ID from storage:', error);
    }
  }

  connect(token) {
    // If already connected, return immediately
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return Promise.resolve();
    }
    
    // If currently connecting, wait for the existing connection attempt
    if (this.isConnecting) {
      console.log('WebSocket connection already in progress');
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (!this.isConnecting) {
            clearInterval(checkInterval);
            if (this.ws?.readyState === WebSocket.OPEN) {
              resolve();
            } else {
              reject(new Error('Connection failed'));
            }
          }
        }, 100);
      });
    }

    this.isConnecting = true;
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    
    // For browser WebSocket, we need to pass token as query parameter since headers aren't supported
    const url = token ? `${wsUrl}/ws?token=${token}` : `${wsUrl}/ws`;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        resolve();
      };

      this.ws.onmessage = (event) => {
        console.log('📥 Raw WebSocket message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          console.log('📋 Parsed WebSocket data:', data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        reject(error);
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        this.isConnecting = false;
        
        // Don't auto-reconnect if it's a clean close or during message processing
        if (event.code !== 1000 && event.code !== 1001) {
          this.attemptReconnect();
        } else {
          console.log('Clean disconnect, not attempting reconnect');
        }
      };
    });
  }

  handleMessage(data) {
    console.log('🔍 WebSocket received message:', {
      type: data.type,
      content: data.content?.substring(0, 100) + '...',
      metadata: data.metadata,
      final: data.final
    });
    
    // Capture session ID from WebSocket responses for persistence
    if (data.metadata && data.metadata.session_id) {
      if (!this.sessionId) {
        console.log('🔗 Captured new session ID:', data.metadata.session_id);
      }
      this.sessionId = data.metadata.session_id;
      // Persist to storage for reconnection resilience
      this.saveSessionId(this.sessionId);
    }
    
    const { type } = data;
    const handlers = this.messageHandlers.get(type) || [];
    if (handlers.length === 0) {
      console.warn(`⚠️ No handlers registered for message type: ${type}`);
    } else {
      console.log(`📨 Processing ${type} with ${handlers.length} handlers`);
    }
    handlers.forEach(handler => handler(data));
  }

  on(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(handler);
  }

  off(type, handler) {
    const handlers = this.messageHandlers.get(type) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('📤 Sending WebSocket message:', data);
      this.ws.send(JSON.stringify(data));
      console.log('✅ Message sent successfully');
    } else {
      console.error('❌ WebSocket is not connected, readyState:', this.ws?.readyState);
    }
  }

  sendQuery(query, conversationId = null, sessionId = null) {
    // Use captured session ID if no explicit session ID provided
    const effectiveSessionId = sessionId || this.sessionId;
    
    // Check if WebSocket is actually ready before sending
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not ready for sending, readyState:', this.ws?.readyState);
      // Try to reconnect
      const token = localStorage.getItem('authToken');
      this.connect(token).then(() => {
        console.log('🔄 Reconnected, retrying query send');
        this.sendQuery(query, conversationId, sessionId);
      }).catch(error => {
        console.error('Failed to reconnect:', error);
      });
      return;
    }
    
    const message = {
      type: 'query',
      content: query,
      conversation_id: conversationId,
      session_id: effectiveSessionId,
      timestamp: new Date().toISOString()
    };
    console.log('Sending query:', message);
    this.send(message);
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms...`);
    setTimeout(() => {
      const token = localStorage.getItem('authToken');
      this.connect(token);
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
    // Keep sessionId in memory and storage for reconnection
    // Only clear when user explicitly ends their session
  }

  // Method to explicitly end user session (clear everything)
  endSession() {
    this.disconnect();
    this.sessionId = null;
    this.clearSessionId();
    console.log('🔚 User session ended, cleared all session data');
  }

  // Method to start a new session (for debugging/testing)
  startNewSession() {
    this.sessionId = null;
    this.clearSessionId();
    console.log('🆕 Started new session, previous context cleared');
  }
}

export const websocketService = new WebSocketService();