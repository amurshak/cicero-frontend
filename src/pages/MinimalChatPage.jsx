import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Send, Scale } from 'lucide-react';

export default function MinimalChatPage() {
  const { user, logout } = useAuth();
  const [message, setMessage] = useState('');

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
    
    // TODO: Implement actual message sending
    console.log('Sending message:', text);
    setMessage('');
  };

  const handlePromptClick = (prompt) => {
    handleSendMessage(prompt);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-primary-900 flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Scale size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Cicero</h1>
            <p className="text-xs text-white/60">Legislative Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-white/80 hidden sm:block">
                  {user.displayName || user.email}
                </span>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        {/* Main Prompt */}
        <div className="text-center mb-12 max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-white">What legislative </span>
            <span className="text-blue-400">information</span>
            <span className="text-white"> do you need?</span>
          </h2>
          <p className="text-white/60 text-lg">
            Ask me about bills, members of Congress, voting records, or any legislative process
          </p>
        </div>

        {/* Suggested Prompts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-16 max-w-4xl w-full">
          {suggestedPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handlePromptClick(prompt)}
              className="group p-4 text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm"
            >
              <span className="text-white/80 group-hover:text-white transition-colors">
                {prompt}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-primary-900/80 backdrop-blur-md border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about legislation..."
              className="w-full px-6 py-4 pr-14 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-white/50 resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all backdrop-blur-sm"
              rows="1"
              style={{ 
                minHeight: '60px',
                maxHeight: '120px'
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!message.trim()}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:cursor-not-allowed rounded-xl transition-all"
            >
              <Send size={20} className="text-white" />
            </button>
          </div>
          
          {/* Usage indicator */}
          {user && (
            <div className="mt-3 text-center">
              <span className="text-xs text-white/40">
                {user.subscriptionTier || 'Free'} Plan • Press Enter to send
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}