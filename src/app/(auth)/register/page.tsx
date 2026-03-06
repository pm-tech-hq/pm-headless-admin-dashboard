// Register Page
// Public route for new user registration

import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata = {
  title: 'Create Account - Admin Dashboard',
  description: 'Create a new account to access the dashboard',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
