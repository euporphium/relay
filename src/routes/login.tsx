import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { authClient } from '@/app/auth/auth-client';
import { useAppForm } from '@/components/form/hooks';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';

const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    } as LoginFormValues,
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const result = await authClient.signIn.email({
          email: value.email,
          password: value.password,
        });

        if (result.error) {
          toast.error(result.error.message || 'Failed to sign in');
          return;
        }

        await router.invalidate();
        router.navigate({ to: '/tasks' });
      } catch {
        toast.error('An unexpected error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.AppField name="email">
                {(field) => <field.Input label="Email" type="email" />}
              </form.AppField>

              <form.AppField name="password">
                {(field) => <field.Input label="Password" type="password" />}
              </form.AppField>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </FieldGroup>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
