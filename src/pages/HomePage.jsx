import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Send, Scale, Menu, Zap, Shield, Clock, TrendingUp, Users, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [queriesUsed, setQueriesUsed] = useState(0);
  const menuRef = useRef(null);

  // Track anonymous queries used
  useEffect(() => {
    if (!user) {
      const storedQueries = localStorage.getItem('anonymousQueriesUsed');
      if (storedQueries) {
        setQueriesUsed(parseInt(storedQueries, 10));
      }
    }
  }, [user]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const suggestedPrompts = [
    "What's in H.R. 1?",
    "Tell me about recent healthcare legislation",
    "How many bills did Congress pass this year?",
    "Give me 3 recent bills",
    "What committees handle immigration?",
    "Show me voting records on climate bills"
  ];

  const handleSendMessage = (text = message) => {
    if (!text.trim()) return;
    
    // TODO: Implement actual message sending via WebSocket
    console.log('Sending message:', text);
    setMessage('');
    
    // For now, navigate to chat page
    navigate('/chat', { state: { initialMessage: text } });
  };

  const handlePromptClick = (prompt) => {
    setMessage(prompt);
    // Focus the input after setting the message
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) textarea.focus();
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-primary-900 flex flex-col">
      {/* Header */}
      <header className="p-4 sm:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Scale size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Cicero</h1>
            <p className="text-xs text-white/60 hidden min-[400px]:block">Legislative Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {user.display_name ? user.display_name[0].toUpperCase() : user.email[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-white/80 hidden sm:block">
                  {user.display_name}
                </span>
              </div>
              
              {/* Desktop Menu - Authenticated */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10"
                >
                  Logout
                </button>
              </div>

              {/* Mobile Menu - Authenticated */}
              <div className="sm:hidden" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <Menu size={20} />
                </button>
                
                {showMenu && (
                  <div className="absolute top-16 right-6 bg-primary-800 border border-white/20 rounded-lg p-2 backdrop-blur-md z-50">
                    <button
                      onClick={() => { logout(); setShowMenu(false); }}
                      className="block w-full text-left px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded transition-all"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Not authenticated - Show login/signup */
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="relative px-3 sm:px-4 py-1.5 sm:py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-lg shadow-blue-600/20 animate-pulse-subtle"
              >
                Start Free
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-6 sm:pb-8">
        {/* Value Proposition Badge */}
        <div className="mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-xs sm:text-sm text-blue-400 font-medium">Powered by Congressional API + AI</span>
          </div>
        </div>

        {/* Main Prompt */}
        <div className="text-center mb-4 sm:mb-6 max-w-3xl">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            <span className="text-white">Your AI Assistant for </span>
            <span className="text-blue-400">Congress</span>
          </h2>
          <p className="text-white/80 text-lg sm:text-xl px-2 sm:px-0 mb-4">
            Instant access to bills, voting records, committee reports, and member information
          </p>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-white/60 text-sm">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>Official data</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Real-time updates</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>113+ data points</span>
            </div>
          </div>
        </div>

        {/* Suggested Prompts */}
        <div className="flex flex-wrap justify-center gap-2 mb-6 sm:mb-8 max-w-2xl px-2 sm:px-0">
          {suggestedPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handlePromptClick(prompt)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input - Centered in content */}
        <div className="w-full max-w-2xl px-2 sm:px-0 mb-8">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about legislation..."
              className="w-full px-4 sm:px-6 py-3 sm:py-4 pr-12 sm:pr-14 bg-white/5 border border-white/20 rounded-xl sm:rounded-2xl text-base text-white placeholder-white/50 resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all backdrop-blur-sm"
              rows="1"
              style={{ 
                minHeight: '60px',
                maxHeight: '120px'
              }}
              autoCapitalize="sentences"
              autoCorrect="on"
              spellCheck="true"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!message.trim()}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:cursor-not-allowed rounded-xl transition-all"
            >
              <Send size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="w-full max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {/* Benefit 1 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-lg mb-3">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">Lightning Fast</h3>
              <p className="text-white/60 text-sm">Get answers in seconds, not hours of research</p>
            </div>

            {/* Benefit 2 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-lg mb-3">
                <Award className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">100% Accurate</h3>
              <p className="text-white/60 text-sm">Direct from Congress.gov official database</p>
            </div>

            {/* Benefit 3 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500/10 rounded-lg mb-3">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">Trusted by Thousands</h3>
              <p className="text-white/60 text-sm">Join researchers, journalists, and citizens</p>
            </div>
          </div>

          {/* CTA for non-authenticated users */}
          {!user && (
            <div className="mt-8 text-center">
              {/* Urgency indicator for anonymous users */}
              {queriesUsed > 0 && (
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-orange-400">
                      {5 - queriesUsed} free {5 - queriesUsed === 1 ? 'query' : 'queries'} remaining today
                    </span>
                  </div>
                </div>
              )}
              
              <p className="text-white/60 text-sm mb-3">
                <span className="text-blue-400 font-semibold">Free users get 10 queries daily</span> • No credit card required
              </p>
              <button
                onClick={() => navigate('/signup')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-600/20"
              >
                Start Free →
              </button>
            </div>
          )}

          {/* User type indicator */}
          {user && (
            <div className="mt-8 text-center">
              <p className="text-white/60 text-sm">
                {user.subscription_tier === 'pro' ? (
                  <span className="text-green-400">✓ Pro Member - 500 queries/day</span>
                ) : user.subscription_tier === 'enterprise' ? (
                  <span className="text-purple-400">★ Enterprise - Unlimited queries</span>
                ) : (
                  <span className="text-blue-400">Free Member - 10 queries/day • <button onClick={() => navigate('/billing')} className="underline hover:text-blue-300">Upgrade</button></span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}