import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useRegister } from '../hooks/useRegister';
import { registerSchema, type RegisterFormData } from '../validators/auth.validators';
import { cn } from '@/shared/lib/utils';

export function RegisterForm() {
  const { mutate: registerUser, isPending, error } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      orgName: '',
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerUser(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {(error as any)?.response?.data?.message || 'Registration failed. Please try again.'}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-foreground">
            First name
          </label>
          <input
            {...register('firstName')}
            type="text"
            id="firstName"
            autoComplete="given-name"
            className={cn(
              'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2',
              'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
              errors.firstName && 'border-destructive'
            )}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-foreground">
            Last name
          </label>
          <input
            {...register('lastName')}
            type="text"
            id="lastName"
            autoComplete="family-name"
            className={cn(
              'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2',
              'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
              errors.lastName && 'border-destructive'
            )}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

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
          autoComplete="new-password"
          className={cn(
            'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2',
            'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
            errors.password && 'border-destructive'
          )}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Min 8 characters, 1 uppercase, 1 number
        </p>
      </div>

      <div>
        <label htmlFor="orgName" className="block text-sm font-medium text-foreground">
          Organization name
        </label>
        <input
          {...register('orgName')}
          type="text"
          id="orgName"
          placeholder="My Organization"
          className={cn(
            'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2',
            'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
            errors.orgName && 'border-destructive'
          )}
        />
        {errors.orgName && (
          <p className="mt-1 text-sm text-destructive">{errors.orgName.message}</p>
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
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
