import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { ArrowLeft, Send, Loader2, ChevronDown, Scale } from 'lucide-react';
import { websocketService } from '../services/websocket';
import { conversationService } from '../services/conversation';
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
  const [assistantStatus, setAssistantStatus] = useState(null); // 'thinking' | 'searching' | 'writing' | null
  const [thinkingTermIndex, setThinkingTermIndex] = useState(0);
  const [conversationId, setConversationId] = useState(null);
  const [conversationTitle, setConversationTitle] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const notifiedConversationIds = useRef(new Set()); // Track which conversation IDs we've already notified about
  
  // Cicero's various thinking states
  const thinkingTerms = [
    'thinking',
    'pontificating',
    'orating',
    'legislating',
    'deliberating',
    'contemplating',
    'analyzing',
    'researching',
    'considering',
    'examining',
    'reflecting',
    'adjudicating'
  ];

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

  // Cycle through thinking terms when status is 'thinking'
  useEffect(() => {
    if (assistantStatus === 'thinking') {
      const interval = setInterval(() => {
        setThinkingTermIndex(prev => (prev + 1) % thinkingTerms.length);
      }, 2500); // Change term every 2.5 seconds
      
      return () => clearInterval(interval);
    }
  }, [assistantStatus, thinkingTerms.length]);

  // Function to load conversation history
  const loadConversationHistory = async (convId) => {
    if (!user || !conversationService.canAccessHistory(user)) {
      console.log('User cannot access conversation history');
      return;
    }

    setIsLoadingHistory(true);
    try {
      const conversationData = await conversationService.getConversationWithMessages(convId);
      
      // Set conversation title
      setConversationTitle(conversationData.title || 'Untitled Conversation');
      
      // Transform messages to match chat interface format
      const chatMessages = conversationData.messages.map(msg => ({
        type: msg.role, // Convert role to type for consistency with chat interface
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }));
      
      setMessages(chatMessages);
      console.log(`Loaded ${chatMessages.length} messages from conversation ${convId}`);
      
      // Scroll to bottom after loading
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      // If we can't load the conversation, start fresh
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Helper function to handle new conversation ID capture
  const handleNewConversationId = (newConversationId, source) => {
    if (newConversationId && !conversationId && !notifiedConversationIds.current.has(newConversationId)) {
      setConversationId(newConversationId);
      console.log(`New conversation ID captured from ${source}: ${newConversationId}`);
      
      // Mark this conversation as notified to prevent duplicate events
      notifiedConversationIds.current.add(newConversationId);
      
      // Notify sidebar immediately when conversation ID is available
      window.dispatchEvent(new CustomEvent('conversationCreated', {
        detail: { conversationId: newConversationId }
      }));
    }
  };

  // Handle conversation navigation state changes
  useEffect(() => {
    const { conversationId: navConversationId, newConversation, initialMessage } = location.state || {};
    
    if (navConversationId) {
      // Resuming existing conversation
      setConversationId(navConversationId);
      console.log(`Resuming conversation: ${navConversationId}`);
      
      // Reset processing state when switching conversations
      setIsProcessing(false);
      setAssistantStatus(null);
      setCurrentStreamingMessage(null);
      
      // Load conversation history
      loadConversationHistory(navConversationId);
    } else if (newConversation) {
      // Starting new conversation (no conversation ID yet)
      setConversationId(null);
      setConversationTitle(null); // Clear conversation title
      setMessages([]); // Clear any existing messages
      
      // Reset processing state for new conversation
      setIsProcessing(false);
      setAssistantStatus(null);
      setCurrentStreamingMessage(null);
      
      console.log('Starting new conversation');
    }

    // NOTE: Initial message handling moved to WebSocket connection useEffect
    // to ensure error handlers are set up before sending queries
  }, [location.state, navigate]); // Re-run when location state changes

  useEffect(() => {
    // Connect to WebSocket
    const connectWebSocket = async () => {
      const token = localStorage.getItem('authToken');
      try {
        await websocketService.connect(token);
        setIsConnecting(false);
        console.log('WebSocket connected successfully');
        // Additional check to ensure connection is really open
        if (websocketService.ws?.readyState === WebSocket.OPEN) {
          console.log('✅ WebSocket is ready to send messages');
        }
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setIsConnecting(false);
      }
    };
    
    connectWebSocket();

    // Set up message handlers
    websocketService.on('connected', (data) => {
      console.log('Connected:', data);
    });

    websocketService.on('query_received', (data) => {
      console.log('Query received:', data);
      setAssistantStatus('thinking');
      setCurrentStreamingMessage(null);
      setThinkingTermIndex(0); // Reset to first term
      
      // Check if this is a new conversation and capture the conversation ID early
      handleNewConversationId(data.metadata?.conversation_id, 'query_received');
    });

    websocketService.on('reasoning_update', (data) => {
      setAssistantStatus('thinking');
      // Don't show reasoning content to user, just the status
      
      // Check if this contains conversation ID for new conversations
      handleNewConversationId(data.metadata?.conversation_id, 'reasoning_update');
    });

    websocketService.on('tool_start', (data) => {
      setAssistantStatus('searching');
      // Don't show tool details to user, just the status
    });

    websocketService.on('tool_result', (data) => {
      setAssistantStatus('searching');
      // Don't show tool results to user, just the status
    });

    websocketService.on('response_chunk', (data) => {
      console.log('📝 Received response chunk:', data);
      // Only process if this response belongs to current conversation or we're creating a new one
      const responseConversationId = data.metadata?.conversation_id;
      if (!responseConversationId || !conversationId || responseConversationId === conversationId) {
        setAssistantStatus(null); // Clear typing indicator when text starts streaming
        setCurrentStreamingMessage(prev => {
          const existingContent = prev?.content || '';
          const newContent = existingContent + data.chunk;
          console.log('📝 Building streaming content:', newContent.length, 'chars');
          return {
            type: 'assistant',
            content: newContent,
            isStreaming: true
          };
        });
      } else {
        console.log('📝 Ignoring response chunk for different conversation:', responseConversationId, 'vs current:', conversationId);
      }
    });

    websocketService.on('response_complete', (data) => {
      console.log('🏁 Response complete handler called:', {
        responseConversationId: data.metadata?.conversation_id,
        currentConversationId: conversationId,
        content: data.content?.substring(0, 50) + '...'
      });
      
      // Only process if this response belongs to current conversation or we're creating a new one
      const responseConversationId = data.metadata?.conversation_id;
      if (!responseConversationId || !conversationId || responseConversationId === conversationId) {
        console.log('✅ Processing response_complete for anonymous user');
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: data.content || data.response,
          timestamp: new Date()
        }]);
        
        // Capture conversation ID from response metadata for new conversations
        handleNewConversationId(data.metadata?.conversation_id, 'response_complete');
        
        setCurrentStreamingMessage(null);
        setAssistantStatus(null);
        setIsProcessing(false);
      } else {
        console.log('📝 Ignoring response complete for different conversation:', responseConversationId, 'vs current:', conversationId);
      }
    });

    websocketService.on('error', (data) => {
      console.log('❌ Error handler called:', {
        content: data.content,
        error: data.error,
        metadata: data.metadata
      });
      
      // Check if this is a rate limit error and provide helpful messaging
      let errorContent = data.content || data.error || 'Unknown error occurred';
      let isRateLimit = data.metadata?.rate_limit || errorContent.includes('Rate limit exceeded');
      
      if (isRateLimit) {
        // Extract reset time and convert to local time
        const resetTime = data.metadata?.reset_time;
        let resetTimeText = "midnight UTC";
        
        if (resetTime) {
          try {
            const resetDate = new Date(resetTime);
            resetTimeText = resetDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              timeZoneName: 'short'
            });
          } catch (e) {
            // Fall back to UTC if parsing fails
            resetTimeText = "midnight UTC";
          }
        }
        
        // Enhanced rate limit messaging for better UX
        errorContent = `🚫 **Daily limit reached** 

Your free queries reset at ${resetTimeText}. 

**Get more queries:**
• Sign up free → 10/day (vs 5 anonymous)  
• Pro plan → 100/day + history
• Enterprise → unlimited

[Sign Up Free →](/auth/signup)`;
      }
      
      // Always process errors for current conversation to show user
      setMessages(prev => [...prev, {
        type: 'error',
        content: errorContent,
        timestamp: new Date(),
        isRateLimit: isRateLimit
      }]);
      setCurrentStreamingMessage(null);
      setAssistantStatus(null);
      setIsProcessing(false);
    });

    // Handle initial message from home page navigation
    // This runs after WebSocket connection and handlers are set up
    const { initialMessage, conversationId: navConversationId } = location.state || {};
    if (initialMessage && websocketService.ws?.readyState === WebSocket.OPEN) {
      console.log('Processing initial message from navigation:', initialMessage);
      setTimeout(() => {
        const messageText = initialMessage;
        if (messageText.trim()) {
          // Add user message
          setMessages(prev => [...prev, {
            type: 'user',
            content: messageText,
            timestamp: new Date()
          }]);
          
          // Set processing state
          setIsProcessing(true);
          
          // Send via WebSocket  
          const currentConversationId = navConversationId || null;
          console.log('Sending initial message via WebSocket:', messageText, 'ConversationId:', currentConversationId);
          websocketService.sendQuery(messageText, currentConversationId);
        }
        
        // Clear the state to prevent re-sending
        navigate(location.pathname, { replace: true });
      }, 100);
    }

    return () => {
      websocketService.disconnect();
    };
  }, [location.state, navigate]); // Include location.state in dependencies

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
    console.log('Sending message via WebSocket:', messageText, 'Conversation ID:', conversationId);
    websocketService.sendQuery(messageText, conversationId);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    
    // Auto-resize the textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
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
              <h1 className="text-xl font-semibold text-white">
                {conversationTitle || 'Legislative Intelligence Chat'}
              </h1>
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
          {/* Conversation history loading indicator */}
          {isLoadingHistory && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-white/60">
                <Loader2 size={20} className="animate-spin" />
                <span>Loading conversation history...</span>
              </div>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div key={index} className="animate-fade-in">
              {message.type === 'user' ? (
                // User message - right aligned
                <div className="flex justify-end mb-6">
                  <div className="max-w-[70%] px-5 py-4 bg-white/[0.08] rounded-2xl transform animate-slide-up">
                    <p className="text-lg text-white/90 whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ) : (
                // Assistant message - full width with avatar
                <div className="group hover:bg-white/[0.02] transition-colors mb-6 animate-slide-up">
                  <div className="px-4 py-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                          <Scale size={16} className="text-white/60" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`whitespace-pre-wrap text-lg leading-relaxed text-white/90 ${
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
          
          {/* Typing Indicator */}
          {assistantStatus && !currentStreamingMessage && (
            <div className="group hover:bg-white/[0.02] transition-colors animate-fade-in">
              <div className="px-4 py-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                      <Scale size={16} className="text-white/60" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      {assistantStatus === 'thinking' && (
                        <>
                          <div className="relative flex items-center gap-2">
                            <span className="text-white/60">Cicero is</span>
                            <div className="relative h-6 w-32 overflow-hidden">
                              <div 
                                className="absolute inset-0 flex items-center transition-transform duration-500 ease-in-out"
                                style={{ transform: `translateY(-${thinkingTermIndex * 24}px)` }}
                              >
                                {thinkingTerms.map((term, index) => (
                                  <div
                                    key={index}
                                    className="h-6 flex items-center absolute w-full"
                                    style={{ transform: `translateY(${index * 24}px)` }}
                                  >
                                    <span className="text-white/60">{term}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </>
                      )}
                      {assistantStatus === 'searching' && (
                        <>
                          <span className="text-white/60">Searching legislative data</span>
                          <Loader2 className="animate-spin w-4 h-4 text-blue-400" />
                        </>
                      )}
                      {assistantStatus === 'writing' && (
                        <>
                          <span className="text-white/60">Cicero is writing</span>
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Streaming message */}
          {currentStreamingMessage && (
            <div className="group hover:bg-white/[0.02] transition-colors animate-fade-in">
              <div className="px-4 py-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                      <Scale size={16} className="text-white/60" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="relative">
                      <p className="whitespace-pre-wrap text-lg leading-relaxed text-white/90">
                        {currentStreamingMessage.content}
                        {currentStreamingMessage.isStreaming && (
                          <span className="inline-block w-2 h-5 bg-blue-400 ml-1 animate-pulse"></span>
                        )}
                      </p>
                    </div>
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
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about bills, members, voting records..."
              disabled={isProcessing || isConnecting}
              className="w-full px-4 py-3 pr-12 bg-white/[0.05] border border-white/10 rounded-lg text-base text-white placeholder-white/50 resize-none focus:outline-none focus:border-white/20 transition-all disabled:opacity-50"
              rows="1"
              style={{ 
                minHeight: '52px',
                maxHeight: '200px',
                overflow: 'hidden'
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
          <div className="flex items-center justify-between mt-2 text-xs text-white/40">
            <span>Shift + Enter for new line</span>
            <span>Cicero can make mistakes. Check important info.</span>
          </div>
        </div>
      </div>
      </div>
    </PageContainer>
  );
}