import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { ArrowLeft, Send, Loader2, ChevronDown, Scale } from 'lucide-react';
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
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const isAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    // Consider "at bottom" if within 100px of the bottom
    return scrollHeight - scrollTop - clientHeight < 100;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll only if already at bottom when new messages arrive
  useEffect(() => {
    if (isAtBottom()) {
      scrollToBottom();
    }
  }, [messages, currentStreamingMessage]);

  // Update scroll indicator visibility based on scroll position
  const handleScroll = () => {
    setShowScrollIndicator(!isAtBottom());
  };

  // Check initial scroll position and after messages load
  useEffect(() => {
    if (messagesContainerRef.current) {
      setShowScrollIndicator(!isAtBottom());
    }
  }, [messages]);

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <PageContainer>
      <div className="h-full bg-primary-900 flex flex-col">
        {/* Header - No border */}
        <div className="flex-shrink-0 p-4">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
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

      {/* Messages - Full width, no borders */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-3xl mx-auto py-4">
          {messages.map((message, index) => (
            <div key={index}>
              {message.type === 'user' ? (
                // User message - right aligned
                <div className="flex justify-end mb-6">
                  <div className="max-w-[70%] px-4 py-3 bg-white/[0.08] rounded-2xl">
                    <p className="text-white/90 whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ) : (
                // Assistant message - full width with avatar
                <div className="group hover:bg-white/[0.02] transition-colors mb-6">
                  <div className="px-4 py-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                          <Scale size={16} className="text-white/60" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`whitespace-pre-wrap text-white/90 ${
                          message.type === 'error' ? 'text-red-400' : ''
                        }`}>
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Streaming message */}
          {currentStreamingMessage && (
            <div className="group hover:bg-white/[0.02] transition-colors">
              <div className="px-4 py-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                      <Scale size={16} className="text-white/60" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="whitespace-pre-wrap text-white/90">{currentStreamingMessage.content}</p>
                    {currentStreamingMessage.isStreaming && (
                      <Loader2 className="animate-spin w-4 h-4 mt-2 text-blue-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to Bottom Indicator */}
      {showScrollIndicator && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-10">
          <button
            onClick={scrollToBottom}
            className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-full shadow-lg transition-all animate-fade-in backdrop-blur-sm"
            aria-label="Scroll to bottom"
          >
            <ChevronDown size={20} className="text-white/80" />
          </button>
        </div>
      )}

      {/* Input - No border, integrated background */}
      <div className="flex-shrink-0 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about bills, members, voting records..."
              disabled={isProcessing || isConnecting}
              className="w-full px-4 py-3 pr-12 bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder-white/50 resize-none focus:outline-none focus:border-white/20 transition-all disabled:opacity-50"
              rows="1"
              style={{ 
                minHeight: '52px',
                maxHeight: '200px'
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isProcessing || isConnecting}
              className="absolute right-2 bottom-2 p-2 bg-white/10 hover:bg-white/20 disabled:bg-transparent disabled:cursor-not-allowed rounded-lg transition-all"
            >
              {isProcessing ? (
                <Loader2 size={16} className="text-white/60 animate-spin" />
              ) : (
                <Send size={16} className="text-white/60" />
              )}
            </button>
          </div>
          <p className="text-xs text-white/40 text-center mt-2">
            Cicero can make mistakes. Check important info.
          </p>
        </div>
      </div>
      </div>
    </PageContainer>
  );
}