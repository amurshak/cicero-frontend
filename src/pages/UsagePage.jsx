import { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { GlassCard } from '../components/shared/GlassCard';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { BarChart3, Clock, Zap, TrendingUp, AlertCircle } from 'lucide-react';

export default function UsagePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsageData();
    // Refresh usage data every 30 seconds
    const interval = setInterval(fetchUsageData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsageData = async () => {
    try {
      const response = await api.get('/rate-limit');
      setUsageData(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch usage data:', err);
      setError('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-lg"></div>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <GlassCard className="text-center">
          <div className="flex items-center justify-center gap-3 text-red-400 mb-4">
            <AlertCircle size={24} />
            <h2 className="text-xl font-semibold">Error Loading Usage Data</h2>
          </div>
          <p className="text-white/60">{error}</p>
          <button 
            onClick={fetchUsageData}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            Retry
          </button>
        </GlassCard>
      </PageContainer>
    );
  }

  // Get subscription limits and usage from real data
  const dailyLimit = usageData?.limit || (user?.subscription_tier === 'pro' ? 500 : user?.subscription_tier === 'enterprise' ? 'Unlimited' : 10);
  const currentDailyUsage = usageData?.current_usage || 0;
  const remaining = usageData?.remaining || 0;
  
  // Calculate monthly usage (estimate based on daily usage * days in month so far)
  const currentDate = new Date();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const dayOfMonth = currentDate.getDate();
  const estimatedMonthlyUsage = Math.round(currentDailyUsage * dayOfMonth);
  const monthlyLimit = dailyLimit === 'Unlimited' ? 'Unlimited' : dailyLimit * daysInMonth;
  
  // Format reset time
  const resetTime = usageData?.reset_time ? new Date(usageData.reset_time) : new Date();
  const formattedResetTime = resetTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Usage & Analytics</h1>
          <p className="text-white/60">Monitor your API usage and limits</p>
        </div>

        {/* Usage Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <BarChart3 size={20} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Daily Usage</h3>
                  <p className="text-sm text-white/60">Queries today</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/80">{currentDailyUsage} used</span>
                <span className="text-white/60">{dailyLimit} limit</span>
              </div>
              {dailyLimit !== 'Unlimited' && (
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((currentDailyUsage / dailyLimit) * 100, 100)}%` }}
                  ></div>
                </div>
              )}
              <p className="text-xs text-white/40">Resets at {formattedResetTime}</p>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Monthly Usage</h3>
                  <p className="text-sm text-white/60">This month</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/80">{estimatedMonthlyUsage} estimated</span>
                <span className="text-white/60">{monthlyLimit} limit</span>
              </div>
              {monthlyLimit !== 'Unlimited' && (
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((estimatedMonthlyUsage / monthlyLimit) * 100, 100)}%` }}
                  ></div>
                </div>
              )}
              <p className="text-xs text-white/40">Day {dayOfMonth} of {daysInMonth}</p>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <Zap size={20} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Remaining Today</h3>
                  <p className="text-sm text-white/60">Available queries</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-white">{remaining}</span>
                <span className="text-sm text-white/60">queries left</span>
              </div>
              {dailyLimit !== 'Unlimited' && (
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((remaining / dailyLimit) * 100, 100)}%` }}
                  ></div>
                </div>
              )}
              <p className="text-xs text-white/40">
                {remaining === 0 ? 'Limit reached' : `${remaining} of ${dailyLimit} remaining`}
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Current Plan */}
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Your Plan</h2>
              <p className="text-white/60">
                {user?.subscription_tier ? 
                  user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1) + ' Plan' 
                  : 'Free Plan'
                }
              </p>
            </div>
            <TrendingUp size={24} className="text-white/40" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-sm text-white/60 mb-1">Daily Limit</h4>
              <p className="text-2xl font-bold text-white">{dailyLimit}</p>
              <p className="text-xs text-white/40">queries per day</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-sm text-white/60 mb-1">Monthly Limit</h4>
              <p className="text-2xl font-bold text-white">{monthlyLimit}</p>
              <p className="text-xs text-white/40">queries per month</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageContainer>
  );
}