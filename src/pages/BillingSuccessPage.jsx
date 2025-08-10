import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { GlassCard } from '../components/shared/GlassCard';
import { Button } from '../components/ui/Button';
import { CheckCircle, ArrowRight, MessageSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function BillingSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verificationComplete, setVerificationComplete] = useState(false);

  // Get session_id from URL params if available
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Refresh user data to get updated subscription info
    const verifySubscription = async () => {
      try {
        // Wait a moment for Stripe webhook to process
        setTimeout(async () => {
          if (refreshUser) {
            await refreshUser();
          }
          setVerificationComplete(true);
          setLoading(false);
        }, 2000);
      } catch (error) {
        console.error('Error refreshing user data:', error);
        setLoading(false);
      }
    };

    verifySubscription();
  }, [refreshUser]);

  const handleStartChatting = () => {
    navigate('/chat', { 
      state: { 
        newConversation: true,
        initialMessage: "I'd like to explore congressional data with my new Pro subscription!"
      }
    });
  };

  const handleViewBilling = () => {
    navigate('/billing');
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <div className="text-white/60">Verifying your subscription...</div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Success Message */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to Policy Pro! 🎉
            </h1>
            <p className="text-lg text-white/80">
              Your subscription has been activated successfully.
            </p>
          </div>
        </div>

        {/* Subscription Details */}
        <GlassCard>
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-white">Your New Benefits</h2>
            <div className="grid gap-3 text-left">
              <div className="flex items-center gap-3 text-white/80">
                <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                <span><strong>100 legislative queries per day</strong> (upgraded from 10)</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                <span>Full congressional data access</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                <span>AI-powered legislative intelligence</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                <span>7 days conversation history</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                <span>Email support</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Next Steps */}
        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard>
            <div className="text-center space-y-3">
              <MessageSquare size={32} className="text-blue-400 mx-auto" />
              <h3 className="text-lg font-semibold text-white">Start Exploring</h3>
              <p className="text-white/60 text-sm">
                Try your enhanced legislative intelligence with 100 daily queries
              </p>
              <Button 
                onClick={handleStartChatting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Start Chatting
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="text-center space-y-3">
              <CheckCircle size={32} className="text-green-400 mx-auto" />
              <h3 className="text-lg font-semibold text-white">Manage Subscription</h3>
              <p className="text-white/60 text-sm">
                View billing details and manage your account
              </p>
              <Button 
                onClick={handleViewBilling}
                variant="outline"
                className="w-full"
              >
                View Billing
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Session Info (for debugging) */}
        {sessionId && (
          <div className="text-center">
            <p className="text-white/40 text-xs">
              Session: {sessionId.substring(0, 20)}...
            </p>
          </div>
        )}

        {/* Tips */}
        <GlassCard className="bg-blue-500/10 border-blue-500/30">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">💡 Pro Tips</h3>
            <ul className="space-y-1 text-white/80 text-sm">
              <li>• Ask about specific bills: "What's the status of HR 1234?"</li>
              <li>• Research members: "Tell me about Senator Smith's voting record"</li>
              <li>• Explore committees: "What bills are in the Judiciary Committee?"</li>
              <li>• Track legislation: "Show me recent healthcare bills"</li>
            </ul>
          </div>
        </GlassCard>
      </div>
    </PageContainer>
  );
}