import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, Lock, Mail, User as UserIcon, AlertCircle, ShieldCheck } from 'lucide-react';
import { registerApi, loginApi } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { extractApiErrorMessage } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';

const registerSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters'),
    email: z
      .string()
      .trim()
      .min(1, 'Email address is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters'),
    confirm_password: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      // 1. Register with backend
      await registerApi({
        email: values.email,
        password: values.password,
        full_name: values.full_name,
      });

      // 2. Seamless auto-login
      try {
        const loginRes = await loginApi({
          email: values.email,
          password: values.password,
        });
        // 3. Store JWT and hydrate current user profile via GET /auth/me
        await login(loginRes.access_token);
        toast.success('Registration successful!', 'Welcome to Smart Budget.');
        // 4. Redirect to /dashboard
        navigate('/dashboard', { replace: true });
      } catch (loginErr: unknown) {
        // Fallback: registration succeeded, prompt user to sign in
        toast.success('Account created!', 'Please sign in with your credentials.');
        navigate('/login', { replace: true });
      }
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err);
      setServerError(message);
      toast.error('Registration failed', message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3 shadow-lg shadow-emerald-950/40">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Create an Account
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Get started with automated UPI receipt tracking &amp; budgets
          </p>
        </div>

        {/* Card Form */}
        <Card className="border-slate-800 bg-slate-900/90 shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            {serverError && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-lg bg-rose-950/50 border border-rose-800/60 flex items-start gap-2.5 text-rose-300 text-xs"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label="Full Name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                icon={<UserIcon className="w-4 h-4" />}
                error={errors.full_name?.message}
                {...register('full_name')}
              />

              <Input
                label="Email Address"
                type="email"
                autoComplete="email"
                placeholder="user@example.com"
                icon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                showPasswordToggle={true}
                error={errors.password?.message}
                {...register('password')}
              />

              <Input
                label="Confirm Password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                icon={<ShieldCheck className="w-4 h-4" />}
                showPasswordToggle={true}
                error={errors.confirm_password?.message}
                {...register('confirm_password')}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  Create Account
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
              <p className="text-xs text-slate-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
