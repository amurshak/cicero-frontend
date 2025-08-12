import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { sharedStyles } from '../shared/sharedStyles';
import { useAuth } from '../../hooks/useAuth';
import { conversationService } from '../../services/conversation';

export function NavigationSidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const isActive = (path) => location.pathname === path;

  // Debug auth state for anonymous user prompt
  useEffect(() => {
    console.log('NavigationSidebar auth state:', { 
      user: user, 
      authLoading: authLoading, 
      isExpanded: isExpanded,
      shouldShowPrompt: !authLoading && !user && isExpanded 
    });
  }, [user, authLoading, isExpanded]);

  // Load conversation history for paid users
  useEffect(() => {
    if (user && conversationService.canAccessHistory(user)) {
      loadConversations();
    } else {
      setConversations([]);
    }
  }, [user]);

  // Listen for new conversations being created
  useEffect(() => {
    const handleConversationCreated = () => {
      if (user && conversationService.canAccessHistory(user)) {
        loadConversations();
      }
    };

    window.addEventListener('conversationCreated', handleConversationCreated);
    return () => window.removeEventListener('conversationCreated', handleConversationCreated);
  }, [user]);

  const loadConversations = async () => {
    if (!user || !conversationService.canAccessHistory(user)) {
      return;
    }

    setConversationsLoading(true);
    try {
      const conversationList = await conversationService.getConversations(20);
      setConversations(conversationList.map(conv => conversationService.formatConversation(conv)));
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setConversationsLoading(false);
    }
  };

  const startNewChat = () => {
    // Navigate to chat page to start a new conversation
    navigate('/chat', { state: { newConversation: true } });
  };

  const openConversation = (conversationId) => {
    navigate('/chat', { state: { conversationId } });
  };

  const deleteConversation = async (conversationId, event) => {
    event.stopPropagation();
    if (!confirm('Delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      await conversationService.deleteConversation(conversationId);
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleUserClick = () => {
    navigate('/billing');
  };

  return (
    <div 
      className={`${isExpanded ? 'w-64' : 'w-16'} flex flex-col noise-bg transition-all duration-300`} 
      style={sharedStyles.navigationSidebarStyles}
    >
      <div style={sharedStyles.strokeStyles} />
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-6 bg-primary-800 p-1 rounded-full z-20 hover:bg-primary-700 transition-colors"
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      <div className="p-4 border-b border-white/10">
        <button 
          onClick={handleHomeClick}
          className="flex items-center gap-3 w-full hover:bg-white/5 rounded-lg p-2 -m-2 transition-all group"
        >
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 transition-colors">
            <span className="text-lg font-bold">C</span>
          </div>
          {isExpanded && (
            <div className="animate-fade-in">
              <h1 className="font-bold text-lg">Cicero</h1>
              <p className="text-xs text-white/60">Legislative Intelligence</p>
            </div>
          )}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {/* New Chat Button */}
        <button
          onClick={startNewChat}
          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-white/70 hover:bg-white/5 hover:text-white w-full border border-white/10 hover:border-white/20"
        >
          <Plus size={20} className="flex-shrink-0" />
          {isExpanded && (
            <span className="animate-fade-in">New Chat</span>
          )}
        </button>

        {/* Conversation History - Only for paid users */}
        {user && conversationService.canAccessHistory(user) && isExpanded && (
          <>
            <div className="pt-4 pb-2">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider px-3">
                Recent Conversations
              </h3>
            </div>
            
            {conversationsLoading ? (
              <div className="px-3 py-2 text-center">
                <div className="animate-pulse text-white/40 text-sm">Loading...</div>
              </div>
            ) : conversations.length > 0 ? (
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => openConversation(conversation.id)}
                    className="group flex items-center justify-between px-3 py-2 rounded-lg transition-all text-white/70 hover:bg-white/5 hover:text-white cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">
                        {conversation.displayTitle}
                      </div>
                      <div className="text-xs text-white/40">
                        {conversation.timeAgo} • {conversation.message_count} msgs
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conversation.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                    >
                      <Trash2 size={14} className="text-white/40 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-2 text-center">
                <div className="text-white/40 text-sm">No conversations yet</div>
                <div className="text-white/30 text-xs mt-1">Start chatting to see history</div>
              </div>
            )}
          </>
        )}

        {/* Upgrade prompt for free users */}
        {user && !conversationService.canAccessHistory(user) && isExpanded && (
          <div className="pt-4">
            <div className="px-3 py-3 bg-blue-600/10 border border-blue-600/20 rounded-lg">
              <div className="text-sm text-blue-300 font-medium mb-1">
                Conversation History
              </div>
              <div className="text-xs text-white/60 mb-2">
                Upgrade to Pro to save and access your chat history
              </div>
              <Link
                to="/billing"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                Upgrade Now →
              </Link>
            </div>
          </div>
        )}

        {/* Sign up prompt for anonymous users */}
        {!authLoading && !user && isExpanded && (
          <div className="pt-4">
            <div className="px-3 py-3 bg-green-600/10 border border-green-600/20 rounded-lg">
              <div className="text-sm text-green-300 font-medium mb-1">
                Get More Queries
              </div>
              <div className="text-xs text-white/60 mb-2">
                Sign up free: 10 daily queries vs 5 for anonymous users
              </div>
              <Link
                to="/auth/signup"
                className="text-xs text-green-400 hover:text-green-300 font-medium"
              >
                Sign Up Free →
              </Link>
            </div>
          </div>
        )}
      </nav>

      {user && (
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleUserClick}
            className="flex items-center gap-3 w-full hover:bg-white/5 rounded-lg p-2 -m-2 transition-all group mb-3"
          >
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-red-500 transition-colors">
              <span className="text-sm font-semibold">
                {user.display_name ? user.display_name[0].toUpperCase() : user.email[0].toUpperCase()}
              </span>
            </div>
            {isExpanded && (
              <div className="flex-1 animate-fade-in">
                <p className="text-sm font-medium truncate">{user.display_name || user.email}</p>
                <p className="text-xs text-white/60">
                  {user.subscription_tier ? 
                    user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1) + ' Plan' 
                    : 'Free Plan'
                  }
                </p>
              </div>
            )}
            <MoreHorizontal size={16} className="text-white/40 flex-shrink-0" />
          </button>

        </div>
      )}
    </div>
  );
}