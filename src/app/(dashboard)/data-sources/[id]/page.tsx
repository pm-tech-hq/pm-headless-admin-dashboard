// Edit Data Source Page
// Form to edit an existing data source

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { DataSourceForm } from '@/components/data-sources/DataSourceForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AuthConfig, DataSourceType } from '@/types/data-source';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const dataSource = await prisma.dataSource.findUnique({
    where: { id },
    select: { name: true },
  });

  return {
    title: dataSource ? `Edit ${dataSource.name} - Admin Dashboard` : 'Edit Data Source',
  };
}

export default async function EditDataSourcePage({ params }: PageProps) {
  const { id } = await params;

  const dataSource = await prisma.dataSource.findUnique({
    where: { id },
  });

  if (!dataSource) {
    notFound();
  }

  // Parse auth config (masked for display)
  const authConfig = JSON.parse(dataSource.authConfig) as AuthConfig;

  const initialData = {
    id: dataSource.id,
    name: dataSource.name,
    description: dataSource.description || undefined,
    type: dataSource.type as DataSourceType,
    baseUrl: dataSource.baseUrl || undefined,
    host: dataSource.host || undefined,
    port: dataSource.port || undefined,
    database: dataSource.database || undefined,
    auth: {
      type: authConfig.type,
      // Don't pre-fill sensitive values - user must re-enter to change
      apiKeyHeader: authConfig.apiKeyHeader,
      apiKeyPrefix: authConfig.apiKeyPrefix,
      username: authConfig.username,
    } as AuthConfig,
    healthCheckEndpoint: dataSource.healthCheckEndpoint || undefined,
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Back Link */}
        <Link
          href="/data-sources"
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Data Sources
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">
            Edit Data Source
          </h1>
          <p className="text-neutral-500 mt-1">
            Update connection settings for {dataSource.name}
          </p>
        </div>

        {/* Form */}
        <DataSourceForm initialData={initialData} />
      </div>
    </div>
  );
}
