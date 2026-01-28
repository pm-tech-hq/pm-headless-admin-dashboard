'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileJson,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { SearchInput } from '@/components/search-filter';

interface Schema {
  id: string;
  name: string;
  description?: string;
  dataSourceId: string;
  dataSource?: { name: string };
  fields: Array<{ name: string; type: string }>;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export default function SchemasPage() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchSchemas();
  }, []);

  const fetchSchemas = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/schemas');
      const data = await response.json();

      if (data.success) {
        setSchemas(data.data || []);
      } else {
        setError(data.error || 'Failed to load schemas');
      }
    } catch (err) {
      setError('Failed to connect to API');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schema?')) return;

    try {
      const response = await fetch(`/api/schemas/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setSchemas((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
    setMenuOpen(null);
  };

  const filteredSchemas = schemas.filter((schema) =>
    search
      ? schema.name.toLowerCase().includes(search.toLowerCase()) ||
        schema.dataSource?.name.toLowerCase().includes(search.toLowerCase())
      : true
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Schemas</h1>
          <p className="text-neutral-500 mt-1">
            View and manage detected data schemas
          </p>
        </div>
        <Link
          href="/admin/schemas/detect"
          className="px-4 py-2.5 bg-neutral-900 text-white rounded-lg font-medium
                   hover:bg-neutral-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Detect New Schema
        </Link>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search schemas..."
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchSchemas}
            className="ml-auto text-sm text-red-600 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {filteredSchemas.length === 0 && !error && (
        <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
          <FileJson className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            {search ? 'No schemas found' : 'No schemas yet'}
          </h3>
          <p className="text-neutral-500 mb-6 max-w-md mx-auto">
            {search
              ? 'Try a different search term'
              : 'Schemas are automatically detected when you connect to a data source'}
          </p>
          <Link
            href="/admin/data-sources/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white
                     rounded-lg font-medium hover:bg-neutral-800"
          >
            <Plus className="w-4 h-4" />
            Add Data Source
          </Link>
        </div>
      )}

      {/* Schemas Grid */}
      {filteredSchemas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchemas.map((schema) => (
            <div
              key={schema.id}
              className="bg-white rounded-xl border border-neutral-200 p-5
                       hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FileJson className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{schema.name}</h3>
                    <p className="text-xs text-neutral-500">
                      {schema.dataSource?.name || 'Unknown source'}
                    </p>
                  </div>
                </div>

                {/* Menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === schema.id ? null : schema.id)}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg"
                  >
                    <MoreVertical className="w-4 h-4 text-neutral-500" />
                  </button>

                  {menuOpen === schema.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg
                                  border border-neutral-200 py-1 min-w-[140px] z-10">
                      <Link
                        href={`/admin/schemas/${schema.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700
                                 hover:bg-neutral-50"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Link>
                      <button
                        onClick={() => handleDelete(schema.id)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600
                                 hover:bg-red-50 w-full"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {schema.description && (
                <p className="text-sm text-neutral-500 mb-3 line-clamp-2">
                  {schema.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-neutral-500 mb-3">
                <span>{schema.fields?.length || 0} fields</span>
                <span>
                  {Math.round((schema.confidence || 0) * 100)}% confidence
                </span>
              </div>

              {/* Fields Preview */}
              <div className="flex flex-wrap gap-1.5">
                {schema.fields?.slice(0, 5).map((field) => (
                  <span
                    key={field.name}
                    className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs"
                  >
                    {field.name}
                  </span>
                ))}
                {schema.fields?.length > 5 && (
                  <span className="px-2 py-0.5 text-neutral-400 text-xs">
                    +{schema.fields.length - 5} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
