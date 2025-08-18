import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePostHog } from 'posthog-js/react';
import { GlassCard } from '../components/shared/GlassCard';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { Scale } from 'lucide-react';
import { trackEvent, EVENTS } from '../services/posthog';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, login, loginWithGoogle, error } = useAuth();
  const posthog = usePostHog();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Initialize Google Sign-In
    if (window.google && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      
      window.google.accounts.id.renderButton(
        document.getElementById('googleSignInButton'),
        { 
          theme: 'filled_black',
          size: 'large',
          width: '100%',
          text: 'continue_with'
        }
      );
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    setLoading(true);
    setLocalError('');
    
    // Track login attempt
    trackEvent(posthog, EVENTS.LOGIN, { method: 'google' });
    
    const result = await loginWithGoogle(response.credential);
    
    if (result.success) {
      navigate('/');
    } else {
      setLocalError(result.error);
      // Track login failure
      trackEvent(posthog, 'login_failed', { method: 'google', error: result.error });
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError('');

    // Track login attempt
    trackEvent(posthog, EVENTS.LOGIN, { method: 'email' });

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setLocalError(result.error);
      // Track login failure
      trackEvent(posthog, 'login_failed', { method: 'email', error: result.error });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-primary-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
            <Scale size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Cicero</h1>
          <p className="text-white/60">Your legislative intelligence assistant</p>
        </div>

        <GlassCard className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              error={localError && localError.includes('email') ? localError : ''}
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              error={localError && localError.includes('password') ? localError : ''}
            />

            {(localError || error) && !localError.includes('email') && !localError.includes('password') && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{localError || error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              Sign In
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white/50">Or continue with</span>
              </div>
            </div>

            <div id="googleSignInButton" className="w-full"></div>

            <p className="text-center text-sm text-white/60">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-400 hover:text-blue-300 transition-colors">
                Sign up
              </Link>
            </p>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}