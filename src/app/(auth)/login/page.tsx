// Login Page
// Public route for user authentication

import { LoginForm } from '@/components/auth/LoginForm';
import { Suspense } from 'react';

export const metadata = {
  title: 'Login - Admin Dashboard',
  description: 'Sign in to access your dashboard',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50" />}>
      <LoginForm />
    </Suspense>
  );
}
