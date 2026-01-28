// NextAuth.js Configuration
// Authentication with credentials provider and database adapter

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      roles: string[];
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    roles: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    roles: string[];
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            userRoles: {
              include: { role: true },
            },
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid credentials');
        }

        // Verify password
        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        // Check if user is active
        if (!user.isActive) {
          throw new Error('Account is disabled');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Log the login
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'login',
            resource: 'auth',
            details: JSON.stringify({ event: 'user_login' }),
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.userRoles.map((ur) => ur.role.name),
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.roles = token.roles;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  events: {
    async signOut({ token }) {
      if (token?.id) {
        await prisma.auditLog.create({
          data: {
            userId: token.id as string,
            action: 'logout',
            resource: 'auth',
            details: JSON.stringify({ event: 'user_logout' }),
          },
        });
      }
    },
  },
};

/**
 * Hash a password for storage
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a new user with hashed password
 */
export async function createUser(
  email: string,
  name: string,
  password: string,
  roleNames: string[] = ['user']
) {
  const passwordHash = await hashPassword(password);

  // Get or create roles
  const roles = await Promise.all(
    roleNames.map(async (roleName) => {
      let role = await prisma.role.findUnique({
        where: { name: roleName },
      });

      if (!role) {
        role = await prisma.role.create({
          data: { name: roleName },
        });
      }

      return role;
    })
  );

  // Create user with roles
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      userRoles: {
        create: roles.map((role) => ({
          roleId: role.id,
        })),
      },
    },
    include: {
      userRoles: {
        include: { role: true },
      },
    },
  });

  return user;
}

/**
 * Seed initial admin user and roles if they don't exist
 */
export async function seedInitialData() {
  // Create admin role if it doesn't exist
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full access',
      isSystem: true,
      permissions: {
        create: {
          resource: '*',
          action: '*',
        },
      },
    },
  });

  // Create user role if it doesn't exist
  await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Regular user with limited access',
      isSystem: true,
    },
  });

  // Create viewer role if it doesn't exist
  await prisma.role.upsert({
    where: { name: 'viewer' },
    update: {},
    create: {
      name: 'viewer',
      description: 'Read-only access',
      isSystem: true,
    },
  });

  // Check if any admin user exists
  const adminExists = await prisma.user.findFirst({
    where: {
      userRoles: {
        some: {
          role: {
            name: 'admin',
          },
        },
      },
    },
  });

  // Create default admin if none exists
  if (!adminExists) {
    const passwordHash = await hashPassword('admin123');

    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Administrator',
        passwordHash,
        isVerified: true,
        userRoles: {
          create: {
            roleId: adminRole.id,
          },
        },
      },
    });

    console.log('Created default admin user: admin@example.com / admin123');
  }
}
