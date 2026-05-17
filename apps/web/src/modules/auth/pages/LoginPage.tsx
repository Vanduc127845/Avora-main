import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../../../components/ui';
import { ArrowLeft, CheckCircle2, KeyRound, Mail, Lock } from 'lucide-react';
import { signInWithOAuth } from '../../../services/supabase';
import { handleApiError, post } from '../../../services';
import { useAuthStore } from '../../../store';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;
type AuthMode = 'login' | 'forgot' | 'reset';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isOAuthLoading, setIsOAuthLoading] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<AuthMode>('login');
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [resetToken, setResetToken] = React.useState<string | null>(null);
  const [newPassword, setNewPassword] = React.useState('');
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const isOAuthEnabled = import.meta.env.VITE_ENABLE_OAUTH !== 'false';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const handleOAuthLogin = async (provider: 'google' | 'microsoft') => {
    try {
      setFormError(null);
      setStatusMessage(null);
      setIsOAuthLoading(provider);
      await signInWithOAuth(provider);
    } catch (error) {
      console.error('OAuth error:', error);
      setFormError(
        error instanceof Error && error.message.includes('Supabase')
          ? 'Google/Microsoft login is not configured yet. Please sign in with email, or add Supabase OAuth keys in production.'
          : 'OAuth login could not start. Please try email login or check the provider configuration.'
      );
      setIsOAuthLoading(null);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setFormError(null);

    try {
      const response = await post<{
        user: { id: string; email: string; name?: string };
        token: string;
      }>('/api/auth/login', data);

      login(response.user, response.token);
      navigate('/dashboard');
    } catch (error) {
      const apiError = handleApiError(error);
      setFormError(apiError.message || apiError.error);
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setFormError(null);
    setStatusMessage(null);
    if (nextMode === 'forgot') {
      setForgotEmail(watch('email') || forgotEmail);
    }
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setStatusMessage(null);
    setResetToken(null);

    try {
      const response = await post<{ message: string; resetToken?: string }>('/api/auth/forgot-password', {
        email: forgotEmail,
      });

      setStatusMessage(response.message);
      if (response.resetToken) {
        setResetToken(response.resetToken);
        setMode('reset');
        return;
      }
    } catch (error) {
      const apiError = handleApiError(error);
      setFormError(apiError.message || apiError.error);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetToken) {
      setFormError('Reset token is missing. Please request a new reset link.');
      return;
    }

    setFormError(null);
    setStatusMessage(null);

    try {
      const response = await post<{ message: string }>('/api/auth/reset-password', {
        token: resetToken,
        password: newPassword,
      });

      setValue('email', forgotEmail);
      setValue('password', '');
      setNewPassword('');
      setResetToken(null);
      setMode('login');
      setStatusMessage(response.message);
    } catch (error) {
      const apiError = handleApiError(error);
      setFormError(apiError.message || apiError.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Avora</h1>
          <CardTitle className="text-2xl">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'forgot' && 'Reset Password'}
            {mode === 'reset' && 'Create New Password'}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {mode === 'login' && 'Sign in to continue your journey'}
            {mode === 'forgot' && 'Enter your email to start password recovery.'}
            {mode === 'reset' && 'Set a new password for this account.'}
          </p>
        </CardHeader>
        <CardContent>
          {statusMessage && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" role="status">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
                <span>{statusMessage}</span>
              </div>
            </div>
          )}

          {formError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {formError}
            </div>
          )}

          {mode === 'login' && isOAuthEnabled && (
            <>
              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={isOAuthLoading !== null}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-stone-200 rounded-xl hover:border-stone-300 hover:bg-stone-50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isOAuthLoading === 'google' ? (
                    <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  <span className="font-medium text-stone-700">Continue with Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthLogin('microsoft')}
                  disabled={isOAuthLoading !== null}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-stone-200 rounded-xl hover:border-stone-300 hover:bg-stone-50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isOAuthLoading === 'microsoft' ? (
                    <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#F25022" d="M1 1h10v10H1z"/>
                      <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                      <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                      <path fill="#FFB900" d="M13 13h10v10H13z"/>
                    </svg>
                  )}
                  <span className="font-medium text-stone-700">Continue with Microsoft</span>
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-stone-500">or continue with email</span>
                </div>
              </div>
            </>
          )}

          {mode === 'login' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                {...register('email')}
                type="email"
                placeholder="Email Address"
                className="input pl-12"
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message as string}</p>
              )}
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                {...register('password')}
                type="password"
                placeholder="Password"
                className="input pl-12"
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message as string}</p>
              )}
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-sm text-primary-600 hover:underline" onClick={() => switchMode('forgot')}>
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Sign In
            </Button>
          </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                  placeholder="Email address"
                  className="input pl-12"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Send Reset Instructions
              </Button>
              <Button type="button" variant="ghost" className="w-full" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => switchMode('login')}>
                Back to sign in
              </Button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password"
                  className="input pl-12"
                  minLength={8}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Update Password
              </Button>
              <Button type="button" variant="ghost" className="w-full" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => switchMode('forgot')}>
                Request another reset
              </Button>
            </form>
          )}

          {mode === 'login' && <p className="mt-6 text-center text-sm text-stone-600">
            New to Avora?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:underline">
              Create an account
            </Link>
          </p>}
        </CardContent>
      </Card>
    </div>
  );
}
