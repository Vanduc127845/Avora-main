import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../../../components/ui';
import { handleApiError, post } from '../../../services';
import { useAuthStore } from '../../../store';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setFormError(null);

    try {
      const response = await post<{
        user: { id: string; email: string; name?: string };
        token: string;
      }>('/api/auth/register', data);

      login(response.user, response.token);
      navigate('/dashboard');
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
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <p className="text-gray-600 mt-2">
            Start with a free account and build your accessibility profile.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {formError}
              </div>
            )}

            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                {...register('name')}
                type="text"
                placeholder="Full name"
                className="input pl-12"
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                {...register('email')}
                type="email"
                placeholder="Email address"
                className="input pl-12"
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
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
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
