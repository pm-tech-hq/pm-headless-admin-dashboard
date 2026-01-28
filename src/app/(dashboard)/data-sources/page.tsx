// Data Sources Page
// Lists all connected data sources

import { DataSourceList } from '@/components/data-sources/DataSourceList';

export const metadata = {
  title: 'Data Sources - Admin Dashboard',
  description: 'Manage your connected data sources',
};

export default function DataSourcesPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <DataSourceList />
      </div>
    </div>
  );
}
