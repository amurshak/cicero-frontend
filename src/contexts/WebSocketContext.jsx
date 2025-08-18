import { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  const [isConnected, setIsConnected] = useState(false);

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
          setIsConnected(true);
        } catch (error) {
          console.error('❌ Failed to connect WebSocket on app startup:', error);
          setIsConnected(false);
        }
      };

      connectWebSocket();
    }

    // Listen for connection state changes
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);

    websocketService.on('connected', handleConnected);
    websocketService.on('disconnected', handleDisconnected);

    // Set initial state
    setIsConnected(websocketService.ws?.readyState === WebSocket.OPEN);

    return () => {
      websocketService.off('connected', handleConnected);
      websocketService.off('disconnected', handleDisconnected);
      // Don't disconnect on unmount - keep connection alive for entire app session
    };
  }, []);

  const value = {
    websocketService,
    isConnected
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};