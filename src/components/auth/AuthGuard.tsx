'use client';

// Auth Guard Component
// Protects routes that require authentication

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  requiredRoles?: string[];
  fallbackUrl?: string;
}

export function AuthGuard({
  children,
  requiredRoles,
  fallbackUrl = '/login',
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push(fallbackUrl);
      return;
    }

    // Check role requirements
    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = session.user?.roles || [];
      const hasRequiredRole = requiredRoles.some((role) =>
        userRoles.includes(role)
      );

      if (!hasRequiredRole) {
        router.push('/unauthorized');
      }
    }
  }, [session, status, router, requiredRoles, fallbackUrl]);

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          <p className="text-sm text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return null;
  }

  // Check role requirements
  if (requiredRoles && requiredRoles.length > 0) {
    const userRoles = session.user?.roles || [];
    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.includes(role)
    );

    if (!hasRequiredRole) {
      return null;
    }
  }

  return <>{children}</>;
}

/**
 * Hook to get current user session
 */
export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    roles: session?.user?.roles || [],
    hasRole: (role: string) => session?.user?.roles?.includes(role) || false,
  };
}

/**
 * Hook to check if user has required permission
 */
export function usePermission(requiredRoles: string[]) {
  const { roles, isAuthenticated } = useAuth();

  if (!isAuthenticated) return false;

  return requiredRoles.some((role) => roles.includes(role));
}

export default AuthGuard;
