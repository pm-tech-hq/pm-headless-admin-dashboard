// Database Seed Script
// Initializes default roles and admin user

import { PrismaClient } from '../src/generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

// Create adapter with file path configuration (database is in root)
const dbPath = path.join(process.cwd(), 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create admin role with all permissions
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
  console.log('Created admin role:', adminRole.name);

  // Create user role
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Regular user with limited access',
      isSystem: true,
      permissions: {
        create: [
          { resource: 'dashboard', action: 'read' },
          { resource: 'dashboard', action: 'create' },
          { resource: 'dashboard', action: 'update' },
          { resource: 'data_source', action: 'read' },
          { resource: 'schema', action: 'read' },
          { resource: 'widget', action: '*' },
          { resource: 'menu', action: '*' },
          { resource: 'crud', action: 'read' },
          { resource: 'crud', action: 'create' },
          { resource: 'crud', action: 'update' },
        ],
      },
    },
  });
  console.log('Created user role:', userRole.name);

  // Create viewer role
  const viewerRole = await prisma.role.upsert({
    where: { name: 'viewer' },
    update: {},
    create: {
      name: 'viewer',
      description: 'Read-only access',
      isSystem: true,
      permissions: {
        create: [
          { resource: 'dashboard', action: 'read' },
          { resource: 'widget', action: 'read' },
          { resource: 'crud', action: 'read' },
        ],
      },
    },
  });
  console.log('Created viewer role:', viewerRole.name);

  // Check if admin user exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });

  if (!existingAdmin) {
    // Create default admin user
    const passwordHash = await bcrypt.hash('admin123', 12);

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Administrator',
        passwordHash,
        isVerified: true,
        isActive: true,
        userRoles: {
          create: {
            roleId: adminRole.id,
          },
        },
      },
    });
    console.log('Created admin user:', adminUser.email);
    console.log('Default credentials: admin@example.com / admin123');
  } else {
    console.log('Admin user already exists');
  }

  // Create default brand settings
  await prisma.brandSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      brandName: 'Admin Dashboard',
      tagline: 'Headless Admin Platform',
      description: 'A powerful headless admin dashboard',
      brandColor: '#000000',
      primaryColor: '#000000',
      secondaryColor: '#666666',
      accentColor: '#0066cc',
      fontFamily: 'system-ui',
    },
  });
  console.log('Created default brand settings');

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
