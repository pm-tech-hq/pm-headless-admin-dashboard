'use client';

// Data Source List Component
// Displays all data sources with status and actions

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Globe,
  Zap,
  Database,
  Plus,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Trash2,
  Edit,
  Loader2,
} from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  description?: string;
  type: string;
  baseUrl?: string;
  healthStatus: string;
  lastHealthCheck?: string;
  createdAt: string;
  createdBy: { id: string; name: string };
  _count: { schemas: number; widgets: number };
}

export function DataSourceList() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchDataSources();
  }, []);

  const fetchDataSources = async () => {
    try {
      const response = await fetch('/api/data-sources');
      const data = await response.json();

      if (data.success) {
        setDataSources(data.data);
      } else {
        setError(data.error || 'Failed to fetch data sources');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const response = await fetch(`/api/data-sources/${id}/test`, {
        method: 'POST',
      });
      const data = await response.json();

      // Update the data source in the list
      setDataSources((prev) =>
        prev.map((ds) =>
          ds.id === id
            ? {
                ...ds,
                healthStatus: data.data?.success ? 'healthy' : 'unhealthy',
                lastHealthCheck: new Date().toISOString(),
              }
            : ds
        )
      );
    } catch (err) {
      console.error('Test connection error:', err);
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this data source?')) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/data-sources/${id}?force=true`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDataSources((prev) => prev.filter((ds) => ds.id !== id));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
      setMenuOpen(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rest':
        return <Globe className="w-5 h-5" />;
      case 'graphql':
        return <Zap className="w-5 h-5" />;
      default:
        return <Database className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      healthy: 'bg-green-100 text-green-700',
      unhealthy: 'bg-red-100 text-red-700',
      unknown: 'bg-yellow-100 text-yellow-700',
    }[status] || 'bg-neutral-100 text-neutral-700';

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${classes}`}
      >
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-xl border border-red-100">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchDataSources}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Data Sources</h2>
          <p className="text-neutral-500 mt-1">
            Connect to APIs, databases, and other data sources
          </p>
        </div>
        <Link
          href="/data-sources/new"
          className="px-4 py-2.5 bg-neutral-900 text-white rounded-lg font-medium
                   hover:bg-neutral-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Data Source
        </Link>
      </div>

      {/* Empty State */}
      {dataSources.length === 0 && (
        <div className="text-center py-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
          <Database className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            No data sources yet
          </h3>
          <p className="text-neutral-500 mb-6 max-w-md mx-auto">
            Connect your first data source to start building dashboards and
            managing data.
          </p>
          <Link
            href="/data-sources/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white
                     rounded-lg font-medium hover:bg-neutral-800"
          >
            <Plus className="w-4 h-4" />
            Add Data Source
          </Link>
        </div>
      )}

      {/* Data Sources Grid */}
      {dataSources.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataSources.map((ds) => (
            <div
              key={ds.id}
              className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-600">
                    {getTypeIcon(ds.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{ds.name}</h3>
                    <p className="text-xs text-neutral-500 uppercase">{ds.type}</p>
                  </div>
                </div>

                {/* Menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === ds.id ? null : ds.id)}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg"
                  >
                    <MoreVertical className="w-4 h-4 text-neutral-500" />
                  </button>

                  {menuOpen === ds.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 min-w-[140px] z-10">
                      <Link
                        href={`/data-sources/${ds.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(ds.id)}
                        disabled={deletingId === ds.id}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                      >
                        {deletingId === ds.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {ds.description && (
                <p className="text-sm text-neutral-500 mb-4 line-clamp-2">
                  {ds.description}
                </p>
              )}

              {/* URL */}
              {ds.baseUrl && (
                <p className="text-xs text-neutral-400 font-mono truncate mb-4">
                  {ds.baseUrl}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-neutral-500 mb-4">
                <span>{ds._count.schemas} schemas</span>
                <span>{ds._count.widgets} widgets</span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                {getStatusBadge(ds.healthStatus)}

                <button
                  onClick={() => handleTestConnection(ds.id)}
                  disabled={testingId === ds.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                           text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200
                           disabled:opacity-50"
                >
                  {testingId === ds.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Test
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DataSourceList;
