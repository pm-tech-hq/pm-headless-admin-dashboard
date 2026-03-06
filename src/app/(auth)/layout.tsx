// Auth Layout
// Layout for authentication pages (login, register, etc.)

import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {children}
    </div>
  );
}
