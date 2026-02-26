import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useLogin } from '../hooks/useLogin';
import { loginSchema, type LoginFormData } from '../validators/auth.validators';
import { cn } from '@/shared/lib/utils';

export function LoginForm() {
  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      tenantSlug: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {(error as any)?.response?.data?.message || 'Login failed. Please try again.'}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          autoComplete="email"
          className={cn(
            'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2',
            'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
            errors.email && 'border-destructive'
          )}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Password
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          autoComplete="current-password"
          className={cn(
            'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2',
            'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
            errors.password && 'border-destructive'
          )}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="tenantSlug" className="block text-sm font-medium text-foreground">
          Organization
        </label>
        <input
          {...register('tenantSlug')}
          type="text"
          id="tenantSlug"
          placeholder="my-organization"
          className={cn(
            'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2',
            'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
            errors.tenantSlug && 'border-destructive'
          )}
        />
        {errors.tenantSlug && (
          <p className="mt-1 text-sm text-destructive">{errors.tenantSlug.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          'flex w-full items-center justify-center rounded-md bg-primary px-4 py-2',
          'text-sm font-medium text-primary-foreground',
          'hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
