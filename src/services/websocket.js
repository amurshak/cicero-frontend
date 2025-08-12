class WebSocketService {
  constructor() {
    this.ws = null;
    this.messageHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnecting = false;
    this.sessionId = null; // Store session ID for persistence
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
        try {
          const data = JSON.parse(event.data);
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

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.attemptReconnect();
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
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  sendQuery(query, conversationId = null, sessionId = null) {
    // Use captured session ID if no explicit session ID provided
    const effectiveSessionId = sessionId || this.sessionId;
    
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
    this.sessionId = null; // Clear session ID on disconnect
  }
}

export const websocketService = new WebSocketService();