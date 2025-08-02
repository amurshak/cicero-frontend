import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { websocketService } from '../services/websocket';
import { useAuth } from '../hooks/useAuth';

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamingMessage]);

  useEffect(() => {
    // Connect to WebSocket
    const token = localStorage.getItem('authToken');
    websocketService.connect(token)
      .then(() => {
        setIsConnecting(false);
        console.log('WebSocket connected successfully');
        // Additional check to ensure connection is really open
        if (websocketService.ws?.readyState === WebSocket.OPEN) {
          console.log('✅ WebSocket is ready to send messages');
        }
      })
      .catch((error) => {
        console.error('Failed to connect to WebSocket:', error);
        setIsConnecting(false);
      });

    // Set up message handlers
    websocketService.on('connected', (data) => {
      console.log('Connected:', data);
    });

    websocketService.on('query_received', (data) => {
      console.log('Query received:', data);
    });

    websocketService.on('reasoning_update', (data) => {
      setCurrentStreamingMessage({
        type: 'assistant',
        content: `🤔 ${data.content}`,
        isStreaming: true
      });
    });

    websocketService.on('tool_start', (data) => {
      setCurrentStreamingMessage({
        type: 'assistant',
        content: `🔧 Using tool: ${data.content}`,
        isStreaming: true
      });
    });

    websocketService.on('tool_result', (data) => {
      setCurrentStreamingMessage({
        type: 'assistant',
        content: `📊 ${data.content}`,
        isStreaming: true
      });
    });

    websocketService.on('response_chunk', (data) => {
      setCurrentStreamingMessage(prev => {
        const existingContent = prev?.content?.replace(/^(🤔|🔧).*?\n/, '') || '';
        return {
          type: 'assistant',
          content: existingContent + data.chunk,
          isStreaming: true
        };
      });
    });

    websocketService.on('response_complete', (data) => {
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: data.content || data.response,
        timestamp: new Date()
      }]);
      setCurrentStreamingMessage(null);
      setIsProcessing(false);
    });

    websocketService.on('error', (data) => {
      setMessages(prev => [...prev, {
        type: 'error',
        content: data.error,
        timestamp: new Date()
      }]);
      setCurrentStreamingMessage(null);
      setIsProcessing(false);
    });

    return () => {
      websocketService.disconnect();
    };
  }, []);

  // Handle initial message from navigation
  useEffect(() => {
    if (location.state?.initialMessage && !isConnecting && !isProcessing) {
      // Wait a moment to ensure WebSocket is fully connected
      setTimeout(() => {
        handleSendMessage(location.state.initialMessage);
        // Clear the state to prevent re-sending on component updates
        navigate(location.pathname, { replace: true });
      }, 500);
    }
  }, [location.state?.initialMessage, isConnecting, isProcessing]);

  const handleSendMessage = (messageText = inputMessage) => {
    if (!messageText.trim() || isProcessing || isConnecting) return;

    // Check if WebSocket is connected
    if (!websocketService.ws || websocketService.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message');
      setMessages(prev => [...prev, {
        type: 'error',
        content: 'Connection lost. Please wait for reconnection...',
        timestamp: new Date()
      }]);
      return;
    }

    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content: messageText,
      timestamp: new Date()
    }]);

    // Clear input
    setInputMessage('');
    setIsProcessing(true);

    // Send via WebSocket
    console.log('Sending message via WebSocket:', messageText);
    websocketService.sendQuery(messageText);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <PageContainer>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-white">Legislative Intelligence Chat</h1>
              <p className="text-sm text-white/60">
                {isConnecting ? 'Connecting...' : 
                 websocketService.ws?.readyState === WebSocket.OPEN ? '🟢 Connected' : '🔴 Disconnected'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xl px-4 py-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.type === 'error'
                      ? 'bg-red-600/20 text-red-200 border border-red-500/30'
                      : 'bg-white/5 text-white border border-white/10'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Streaming message */}
            {currentStreamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-xl px-4 py-3 rounded-2xl bg-white/5 text-white border border-white/10">
                  <p className="whitespace-pre-wrap">{currentStreamingMessage.content}</p>
                  {currentStreamingMessage.isStreaming && (
                    <Loader2 className="animate-spin w-4 h-4 mt-2 text-blue-400" />
                  )}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="p-6 border-t border-white/10">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about bills, members, voting records..."
                disabled={isProcessing || isConnecting}
                className="w-full px-6 py-4 pr-14 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-white/50 resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all backdrop-blur-sm disabled:opacity-50"
                rows="1"
                style={{ 
                  minHeight: '60px',
                  maxHeight: '120px'
                }}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isProcessing || isConnecting}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:cursor-not-allowed rounded-xl transition-all"
              >
                {isProcessing ? (
                  <Loader2 size={20} className="text-white animate-spin" />
                ) : (
                  <Send size={20} className="text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}