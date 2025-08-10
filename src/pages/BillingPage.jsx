import { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { GlassCard } from '../components/shared/GlassCard';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';

export default function BillingPage() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stripe Payment Link from environment variable
  const STRIPE_PAYMENT_LINK = import.meta.env.VITE_STRIPE_PAYMENT_LINK_PRO;

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stripe/subscription');
      setSubscription(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    // Redirect to Stripe payment link
    window.location.href = STRIPE_PAYMENT_LINK;
  };

  const handleManageSubscription = async () => {
    try {
      const response = await api.post('/stripe/create-portal-session');
      if (response.data.success) {
        window.location.href = response.data.portal_url;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to open billing portal');
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="h-full flex items-center justify-center">
          <div className="text-white/60">Loading subscription...</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
          <p className="text-white/60">Manage your Cicero subscription and usage</p>
        </div>

        {error && (
          <GlassCard className="border-red-500/30 bg-red-500/10">
            <p className="text-red-400">{error}</p>
          </GlassCard>
        )}

        {/* Current Plan */}
        <GlassCard>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Current Plan</h2>
              <div className="space-y-1">
                <p className="text-white/80">
                  <span className="font-medium">Tier:</span> {subscription?.tier === 'pro' ? 'Policy Pro' : 'Free'}
                </p>
                <p className="text-white/80">
                  <span className="font-medium">Queries per day:</span> {subscription?.tier === 'pro' ? '100' : '10'}
                </p>
                {subscription?.has_subscription && (
                  <>
                    <p className="text-white/80">
                      <span className="font-medium">Status:</span> {subscription.status}
                    </p>
                    <p className="text-white/80">
                      <span className="font-medium">Next billing:</span> {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              {subscription?.has_subscription ? (
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-white">$49/month</div>
                  <Button onClick={handleManageSubscription} variant="outline">
                    Manage Subscription
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-lg text-white/60">Free</div>
                  <Button onClick={handleUpgrade} className="bg-blue-600 hover:bg-blue-700">
                    Upgrade to Pro
                  </Button>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Plan Comparison */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <GlassCard className={subscription?.tier === 'free' ? 'border-blue-500/50' : ''}>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Free</h3>
              <div className="text-3xl font-bold text-white mb-4">$0</div>
              <ul className="space-y-2 text-white/80 text-left">
                <li>• 10 legislative queries per day</li>
                <li>• Full congressional data access</li>
                <li>• AI-powered legislative intelligence</li>
                <li>• 7 days conversation history</li>
              </ul>
              {subscription?.tier === 'free' && (
                <div className="mt-4 px-3 py-2 bg-blue-500/20 rounded-lg">
                  <span className="text-blue-400 font-medium">Current Plan</span>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Pro Plan */}
          <GlassCard className={subscription?.tier === 'pro' ? 'border-blue-500/50' : 'border-blue-400/30'}>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Policy Pro</h3>
              <div className="text-3xl font-bold text-white mb-1">$49</div>
              <div className="text-white/60 mb-4">per month</div>
              <ul className="space-y-2 text-white/80 text-left">
                <li>• <strong>100 legislative queries per day</strong></li>
                <li>• Full congressional data access</li>
                <li>• AI-powered legislative intelligence</li>
                <li>• 7 days conversation history</li>
                <li>• Email support</li>
              </ul>
              <div className="mt-4">
                {subscription?.tier === 'pro' ? (
                  <div className="px-3 py-2 bg-blue-500/20 rounded-lg">
                    <span className="text-blue-400 font-medium">Current Plan</span>
                  </div>
                ) : (
                  <Button onClick={handleUpgrade} className="w-full bg-blue-600 hover:bg-blue-700">
                    Upgrade Now
                  </Button>
                )}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Enterprise CTA */}
        <GlassCard className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Need More?</h3>
          <p className="text-white/80 mb-4">
            For unlimited queries, API access, and custom solutions
          </p>
          <Button variant="outline">Contact Sales for Enterprise</Button>
        </GlassCard>
      </div>
    </PageContainer>
  );
}