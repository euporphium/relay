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

const signupSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export const Route = createFileRoute('/signup')({
  component: SignupPage,
});

function SignupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useAppForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    } as SignupFormValues,
    validators: { onSubmit: signupSchema },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const result = await authClient.signUp.email({
          name: value.name,
          email: value.email,
          password: value.password,
        });

        if (result.error) {
          toast.error(result.error.message || 'Failed to create account');
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
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md" size="sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Enter your details to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.AppField name="name">
                {(field) => <field.Input label="Name" />}
              </form.AppField>

              <form.AppField name="email">
                {(field) => <field.Input label="Email" type="email" />}
              </form.AppField>

              <form.AppField name="password">
                {(field) => <field.Input label="Password" type="password" />}
              </form.AppField>

              <form.AppField name="confirmPassword">
                {(field) => (
                  <field.Input label="Confirm password" type="password" />
                )}
              </form.AppField>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>
            </FieldGroup>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
