import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { GlassCard } from '../components/shared/GlassCard';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Search, TrendingUp, Users } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: MessageSquare,
      title: 'Intelligent Chat',
      description: 'Ask questions about bills, members, and legislative processes',
      action: () => navigate('/chat')
    },
    {
      icon: Search,
      title: 'Advanced Search',
      description: 'Search through comprehensive congressional data',
      action: () => navigate('/search')
    },
    {
      icon: TrendingUp,
      title: 'Legislative Tracking',
      description: 'Monitor bill progress and voting patterns',
      action: () => navigate('/chat')
    },
    {
      icon: Users,
      title: 'Member Insights',
      description: 'Detailed information about Congress members',
      action: () => navigate('/search')
    }
  ];

  return (
    <PageContainer>
      <div className="px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Welcome back, {user?.displayName || user?.email}
            </h1>
            <p className="text-xl text-white/60">
              Your legislative intelligence assistant is ready to help
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {features.map((feature, index) => (
              <GlassCard 
                key={index} 
                className="p-6 hover:transform hover:scale-[1.02] transition-transform cursor-pointer"
                onClick={feature.action}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-600/20 rounded-lg">
                    <feature.icon size={24} className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-white/60">{feature.description}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          <GlassCard variant="prominent" className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to start?</h2>
            <p className="text-white/60 mb-6">
              Ask me anything about current legislation, congressional members, or the legislative process
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/chat')}
            >
              Start Chatting
            </Button>
          </GlassCard>
        </div>
      </div>
    </PageContainer>
  );
}