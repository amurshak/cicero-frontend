import { createContext, useContext, useEffect, useRef } from 'react';
import { websocketService } from '../services/websocket';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const isInitialized = useRef(false);

  useEffect(() => {
    // Connect to WebSocket when app starts, only once
    if (!isInitialized.current) {
      const connectWebSocket = async () => {
        const token = localStorage.getItem('authToken');
        try {
          console.log('🔌 Connecting WebSocket from app startup...');
          await websocketService.connect(token);
          console.log('✅ WebSocket connected and ready for entire app session');
          isInitialized.current = true;
        } catch (error) {
          console.error('❌ Failed to connect WebSocket on app startup:', error);
        }
      };

      connectWebSocket();
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive for entire app session
    };
  }, []);

  const value = {
    websocketService,
    isConnected: websocketService.ws?.readyState === WebSocket.OPEN
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};