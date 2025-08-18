import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePostHog } from 'posthog-js/react';
import { PageContainer } from '../components/layout/PageContainer';
import { ArrowLeft, Send, Loader2, ChevronDown, Scale } from 'lucide-react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { conversationService } from '../services/conversation';
import { useAuth } from '../hooks/useAuth';
import { trackEvent, EVENTS } from '../services/posthog';
import { useChatStateMachine, CONNECTION_STATES, CONVERSATION_STATES } from '../hooks/useChatStateMachine';

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { websocketService, isConnected } = useWebSocket();
  const posthog = usePostHog();
  
  // Use state machine for chat state management
  const chatState = useChatStateMachine();
  
  // UI state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
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

  // Cycle through thinking terms when in thinking state
  useEffect(() => {
    if (chatState.conversation === CONVERSATION_STATES.THINKING) {
      const interval = setInterval(() => {
        setThinkingTermIndex(prev => (prev + 1) % thinkingTerms.length);
      }, 2500); // Change term every 2.5 seconds
      
      return () => clearInterval(interval);
    }
  }, [chatState.conversation, thinkingTerms.length]);

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
      
      // Reset chat state when switching conversations
      chatState.reset();
      setCurrentStreamingMessage(null);
      
      // Load conversation history
      loadConversationHistory(navConversationId);
    } else if (newConversation) {
      // Starting new conversation (no conversation ID yet)
      setConversationId(null);
      setConversationTitle(null); // Clear conversation title
      setMessages([]); // Clear any existing messages
      
      // Reset chat state for new conversation
      chatState.reset();
      setCurrentStreamingMessage(null);
      
      console.log('Starting new conversation');
    }

    // NOTE: Initial message handling moved to WebSocket connection useEffect
    // to ensure error handlers are set up before sending queries
  }, [location.state, navigate]); // Re-run when location state changes

  useEffect(() => {
    // Update connection state based on WebSocket context
    if (isConnected) {
      console.log('✅ Using existing WebSocket connection from context');
      chatState.connected();
    } else {
      chatState.disconnect();
    }

    // Define message handlers (store references for cleanup)
    const connectedHandler = (data) => {
      console.log('Connected:', data);
      chatState.connected();
    };

    const queryReceivedHandler = (data) => {
      console.log('Query received:', data);
      chatState.startThinking();
      setCurrentStreamingMessage(null);
      setThinkingTermIndex(0); // Reset to first term
      
      // Check if this is a new conversation and capture the conversation ID early
      handleNewConversationId(data.metadata?.conversation_id, 'query_received');
    };

    const reasoningUpdateHandler = (data) => {
      chatState.startThinking();
      // Don't show reasoning content to user, just the status
      
      // Check if this contains conversation ID for new conversations
      handleNewConversationId(data.metadata?.conversation_id, 'reasoning_update');
    };

    const toolStartHandler = (data) => {
      chatState.startSearching();
      // Don't show tool details to user, just the status
    };

    const toolResultHandler = (data) => {
      chatState.startSearching();
      // Don't show tool results to user, just the status
    };

    const responseChunkHandler = (data) => {
      console.log('📝 Received response chunk:', data);
      // Only process if this response belongs to current conversation or we're creating a new one
      const responseConversationId = data.metadata?.conversation_id;
      if (!responseConversationId || !conversationId || responseConversationId === conversationId) {
        chatState.startStreaming(); // Move to streaming state
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
    };

    const responseCompleteHandler = (data) => {
      console.log('🏁 Response complete handler called:', {
        responseConversationId: data.metadata?.conversation_id,
        currentConversationId: conversationId,
        content: data.content?.substring(0, 50) + '...'
      });
      
      // Only process if this response belongs to current conversation or we're creating a new one
      const responseConversationId = data.metadata?.conversation_id;
      if (!responseConversationId || !conversationId || responseConversationId === conversationId) {
        console.log('✅ Processing response_complete for anonymous user');
        
        // Track successful chat response
        trackEvent(posthog, EVENTS.CHAT_RESPONSE_RECEIVED, {
          response_length: (data.content || data.response || '').length,
          conversation_id: responseConversationId,
          user_type: user ? (user.subscription_tier || 'free') : 'anonymous'
        });
        
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: data.content || data.response,
          timestamp: new Date()
        }]);
        
        // Capture conversation ID from response metadata for new conversations
        handleNewConversationId(data.metadata?.conversation_id, 'response_complete');
        
        setCurrentStreamingMessage(null);
        chatState.responseComplete();
      } else {
        console.log('📝 Ignoring response complete for different conversation:', responseConversationId, 'vs current:', conversationId);
      }
    };

    const errorHandler = (data) => {
      console.log('❌ Error handler called for homepage query:', {
        content: data.content,
        error: data.error,
        metadata: data.metadata,
        isFromHomepage: !!initialMessage
      });
      
      // Check if this is a rate limit error and provide helpful messaging
      let errorContent = data.content || data.error || 'Unknown error occurred';
      let isRateLimit = data.metadata?.rate_limit || errorContent.includes('Rate limit exceeded');
      
      if (isRateLimit) {
        // Track rate limit hit
        trackEvent(posthog, EVENTS.RATE_LIMIT_HIT, {
          user_type: data.metadata?.user_type || 'unknown',
          daily_limit: data.metadata?.daily_limit,
          reset_time: data.metadata?.reset_time,
        });

        // Calculate hours until reset (24 hours from first query)
        const resetTime = data.metadata?.reset_time;
        let resetText = "in 24 hours";
        
        if (resetTime) {
          try {
            const resetDate = new Date(resetTime);
            const now = new Date();
            const hoursUntilReset = Math.ceil((resetDate - now) / (1000 * 60 * 60));
            resetText = hoursUntilReset > 1 ? `in ${hoursUntilReset} hours` : "in less than 1 hour";
          } catch (e) {
            resetText = "in 24 hours";
          }
        }
        
        // Different messages for anonymous vs logged-in users
        const userType = data.metadata?.user_type;
        if (userType === 'anonymous user') {
          errorContent = `Daily query limit reached. Your limit resets ${resetText}. Sign up for more...`;
          trackEvent(posthog, EVENTS.RATE_LIMIT_UPGRADE_PROMPT, { action: 'sign_up_prompt' });
        } else {
          errorContent = `Daily query limit reached. Your limit resets ${resetText}. Upgrade for more...`;
          trackEvent(posthog, EVENTS.RATE_LIMIT_UPGRADE_PROMPT, { action: 'upgrade_prompt' });
        }
      }
      
      // Always process errors for current conversation to show user
      console.log('🚨 Adding error message to chat:', {
        errorContent,
        isRateLimit,
        userType: data.metadata?.user_type
      });
      
      setMessages(prev => [...prev, {
        type: 'error',
        content: errorContent,
        timestamp: new Date(),
        isRateLimit: isRateLimit
      }]);
      setCurrentStreamingMessage(null);
      
      // Set appropriate state based on error type
      if (isRateLimit) {
        chatState.setRateLimit({ 
          reset_time: data.metadata?.reset_time,
          user_type: data.metadata?.user_type 
        });
      } else {
        chatState.setError(errorContent);
      }
      
      console.log('✅ Processing state cleared after error');
    };

    // Add disconnection handler to reset chat state
    const disconnectedHandler = () => {
      console.log('⚠️ WebSocket disconnected');
      chatState.disconnect();
      setCurrentStreamingMessage(null);
    };

    // Register all handlers
    websocketService.on('connected', connectedHandler);
    websocketService.on('disconnected', disconnectedHandler);
    websocketService.on('query_received', queryReceivedHandler);
    websocketService.on('reasoning_update', reasoningUpdateHandler);
    websocketService.on('tool_start', toolStartHandler);
    websocketService.on('tool_result', toolResultHandler);
    websocketService.on('response_chunk', responseChunkHandler);
    websocketService.on('response_complete', responseCompleteHandler);
    websocketService.on('error', errorHandler);

    // Handle initial message from home page navigation
    // WebSocket should already be connected from context
    const { initialMessage, conversationId: navConversationId } = location.state || {};
    if (initialMessage && isConnected) {
      console.log('Processing initial message from navigation:', initialMessage);
      // Small delay to ensure handlers are set up
      setTimeout(() => {
        const messageText = initialMessage;
        if (messageText.trim()) {
          // Add user message first, so it's always visible
          setMessages(prev => [...prev, {
            type: 'user',
            content: messageText,
            timestamp: new Date()
          }]);
          
          // Set processing state
          chatState.sendMessage();
          
          // Send via WebSocket  
          const currentConversationId = navConversationId || null;
          console.log('Sending initial message via WebSocket:', messageText, 'ConversationId:', currentConversationId);
          websocketService.sendQuery(messageText, currentConversationId);
          
          // Safety timeout in case WebSocket response never comes
          // Only reset if we're still in sending state (no acknowledgment received)
          setTimeout(() => {
            if (chatState.conversation === CONVERSATION_STATES.SENDING) {
              console.warn('No WebSocket response received after 30s, clearing processing state');
              chatState.reset();
            }
          }, 30000); // 30 second timeout for complex queries
        }
        
        // Clear the state to prevent re-sending
        navigate(location.pathname, { replace: true });
      }, 100); // Minimal delay since WebSocket is pre-connected
    } else if (initialMessage) {
      // WebSocket not ready yet, but still show the user's message
      console.log('WebSocket not ready, showing message but not sending yet:', initialMessage);
      setMessages(prev => [...prev, {
        type: 'user',
        content: initialMessage,
        timestamp: new Date()
      }]);
      
      // Try again after WebSocket is ready
      let retryAttempts = 0;
      const maxRetryAttempts = 50; // 5 seconds max
      
      const retryInitialMessage = () => {
        retryAttempts++;
        if (websocketService.ws?.readyState === WebSocket.OPEN) {
          console.log('Retrying initial message send:', initialMessage);
          chatState.sendMessage();
          const currentConversationId = navConversationId || null;
          websocketService.sendQuery(initialMessage, currentConversationId);
          navigate(location.pathname, { replace: true });
          
          // Safety timeout in case error handler doesn't fire
          setTimeout(() => {
            if (chatState.conversation === CONVERSATION_STATES.SENDING) {
              console.warn('No WebSocket response received in retry after 30s, clearing processing state');
              chatState.reset();
            }
          }, 30000); // 30 second timeout for complex queries
          
        } else if (retryAttempts < maxRetryAttempts) {
          setTimeout(retryInitialMessage, 100);
        } else {
          console.error('WebSocket connection timeout for initial message');
          chatState.setError('Connection timeout');
          setMessages(prev => [...prev, {
            type: 'error',
            content: 'Connection failed. Please refresh and try again.',
            timestamp: new Date()
          }]);
        }
      };
      setTimeout(retryInitialMessage, 100);
    }

    return () => {
      // Clean up event handlers to prevent duplicates
      websocketService.off('connected', connectedHandler);
      websocketService.off('query_received', queryReceivedHandler);
      websocketService.off('reasoning_update', reasoningUpdateHandler);
      websocketService.off('tool_start', toolStartHandler);
      websocketService.off('tool_result', toolResultHandler);
      websocketService.off('response_chunk', responseChunkHandler);
      websocketService.off('response_complete', responseCompleteHandler);
      websocketService.off('error', errorHandler);
      
      // Don't disconnect WebSocket - it's managed by the context
      // and should persist across page navigation
    };
  }, [location.state, navigate, isConnected]); // Include WebSocket connection state

  const handleSendMessage = (messageText = inputMessage) => {
    if (!messageText.trim() || !chatState.canSendMessage) return;

    // Track chat message sent
    trackEvent(posthog, EVENTS.CHAT_MESSAGE_SENT, {
      message_length: messageText.length,
      has_conversation_id: !!conversationId,
      user_type: user ? (user.subscription_tier || 'free') : 'anonymous'
    });

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

    // Clear input and update state
    setInputMessage('');
    chatState.sendMessage();

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
                {chatState.connection === CONNECTION_STATES.CONNECTING ? 'Connecting...' : 
                 chatState.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
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
          {(chatState.conversation === CONVERSATION_STATES.THINKING || chatState.conversation === CONVERSATION_STATES.SEARCHING) && !currentStreamingMessage && (
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
                      {chatState.conversation === CONVERSATION_STATES.THINKING && (
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
                      {chatState.conversation === CONVERSATION_STATES.SEARCHING && (
                        <>
                          <span className="text-white/60">Searching legislative data</span>
                          <Loader2 className="animate-spin w-4 h-4 text-blue-400" />
                        </>
                      )}
                      {chatState.conversation === CONVERSATION_STATES.STREAMING && (
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
              disabled={!chatState.canSendMessage}
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
              disabled={!inputMessage.trim() || !chatState.canSendMessage}
              className="absolute right-2 bottom-2 p-2 bg-white/10 hover:bg-white/20 disabled:bg-transparent disabled:cursor-not-allowed rounded-lg transition-all"
            >
              {chatState.isProcessing ? (
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