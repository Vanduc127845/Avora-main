import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { useAuthStore } from '../../../store';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const initAuth = useAuthStore((state) => state.initAuth);

  React.useEffect(() => {
    const handleCallback = async () => {
      try {
        if (!supabase) {
          setError('Authentication not configured');
          return;
        }

        // Supabase processes the OAuth callback from URL hash
        // Wait a bit for the session to be established
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          // Initialize auth store with the session data
          await initAuth();
          // Small delay to ensure state propagates
          await new Promise(resolve => setTimeout(resolve, 100));
          navigate('/dashboard');
        } else {
          // Try one more time after a delay - OAuth can be slow
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retry = await supabase.auth.getSession();
          if (retry.data.session) {
            await initAuth();
            await new Promise(resolve => setTimeout(resolve, 100));
            navigate('/dashboard');
          } else {
            navigate('/login');
          }
        }
      } catch (err: unknown) {
        console.error('Auth callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
      }
    };

    handleCallback();
  }, [navigate, initAuth]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-semibold text-stone-900 mb-2">Authentication Failed</h2>
          <p className="text-stone-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
        <p className="text-stone-600">Completing sign in...</p>
      </div>
    </div>
  );
}
