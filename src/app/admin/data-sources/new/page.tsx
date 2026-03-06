'use client';

import { DataSourceForm } from '@/components/data-sources/DataSourceForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewAdminDataSourcePage() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Back Link */}
      <Link
        href="/admin/data-sources"
        className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Data Sources
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Add Data Source</h1>
        <p className="text-neutral-500 mt-1">
          Connect to a REST API, GraphQL endpoint, or database
        </p>
      </div>

      {/* Form */}
      <DataSourceForm />
    </div>
  );
}
