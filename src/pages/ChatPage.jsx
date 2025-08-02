import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { ArrowLeft } from 'lucide-react';

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [initialMessage, setInitialMessage] = useState('');

  useEffect(() => {
    if (location.state?.initialMessage) {
      setInitialMessage(location.state.initialMessage);
    }
  }, [location.state]);

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
              <h1 className="text-xl font-semibold text-white">Chat</h1>
              <p className="text-sm text-white/60">Legislative Intelligence Assistant</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Chat Interface Coming Soon</h2>
            <p className="text-white/60 mb-6">
              We're building a real-time streaming chat interface for legislative intelligence.
            </p>
            {initialMessage && (
              <div className="p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-200 mb-2">Your query:</p>
                <p className="text-white font-medium">"{initialMessage}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}