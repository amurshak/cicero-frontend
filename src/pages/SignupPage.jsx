import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/shared/GlassCard';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { Scale } from 'lucide-react';
import { trackEvent, EVENTS } from '../services/posthog';

export default function SignupPage() {
  const navigate = useNavigate();
  const { user, signup, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
        document.getElementById('googleSignUpButton'),
        { 
          theme: 'filled_black',
          size: 'large',
          width: '100%',
          text: 'signup_with'
        }
      );
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    setLoading(true);
    setErrors({});
    
    // Track signup attempt
    trackEvent(EVENTS.SIGNUP_STARTED, { method: 'google' });
    
    const result = await loginWithGoogle(response.credential);
    
    if (result.success) {
      trackEvent(EVENTS.SIGNUP_COMPLETED, { method: 'google' });
      navigate('/');
    } else {
      setErrors({ general: result.error });
      trackEvent('signup_failed', { method: 'google', error: result.error });
    }
    setLoading(false);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.displayName) {
      newErrors.displayName = 'Display name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    // Track signup attempt
    trackEvent(EVENTS.SIGNUP_STARTED, { method: 'email' });

    const result = await signup(formData.email, formData.password, formData.displayName);
    
    if (result.success) {
      trackEvent(EVENTS.SIGNUP_COMPLETED, { method: 'email' });
      navigate('/');
    } else {
      setErrors({ general: result.error });
      trackEvent('signup_failed', { method: 'email', error: result.error });
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-primary-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
            <Scale size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-white/60">Start your legislative intelligence journey</p>
        </div>

        <GlassCard className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              name="displayName"
              label="Display Name"
              placeholder="John Doe"
              value={formData.displayName}
              onChange={handleChange}
              required
              error={errors.displayName}
            />

            <Input
              type="email"
              name="email"
              label="Email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              error={errors.email}
            />

            <Input
              type="password"
              name="password"
              label="Password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              error={errors.password}
            />

            <Input
              type="password"
              name="confirmPassword"
              label="Confirm Password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              error={errors.confirmPassword}
            />

            {errors.general && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{errors.general}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              Create Account
            </Button>

            <div className="relative flex items-center">
              <div className="flex-1 border-t border-white/10"></div>
              <span className="px-4 text-sm text-white/50">Or sign up with</span>
              <div className="flex-1 border-t border-white/10"></div>
            </div>

            <div id="googleSignUpButton" className="w-full"></div>

            <p className="text-center text-sm text-white/60">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}