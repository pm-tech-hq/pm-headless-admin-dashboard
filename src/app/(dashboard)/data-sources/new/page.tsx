// New Data Source Page
// Form to create a new data source

import { DataSourceForm } from '@/components/data-sources/DataSourceForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Add Data Source - Admin Dashboard',
  description: 'Connect a new data source',
};

export default function NewDataSourcePage() {
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
          <h1 className="text-2xl font-bold text-neutral-900">Add Data Source</h1>
          <p className="text-neutral-500 mt-1">
            Connect to a REST API, GraphQL endpoint, or database
          </p>
        </div>

        {/* Form */}
        <DataSourceForm />
      </div>
    </div>
  );
}
