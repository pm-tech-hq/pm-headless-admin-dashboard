'use client';

// Data Source Form Component
// Create and edit data sources with connection testing

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Zap,
  Globe,
  Database,
  Key,
  Server,
} from 'lucide-react';
import { DataSourceType, AuthenticationType, AuthConfig } from '@/types/data-source';

interface DataSourceFormProps {
  initialData?: {
    id?: string;
    name: string;
    description?: string;
    type: DataSourceType;
    baseUrl?: string;
    host?: string;
    port?: number;
    database?: string;
    auth: AuthConfig;
    healthCheckEndpoint?: string;
  };
  onSuccess?: () => void;
}

export function DataSourceForm({ initialData, onSuccess }: DataSourceFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    type: initialData?.type || 'rest' as DataSourceType,
    baseUrl: initialData?.baseUrl || '',
    host: initialData?.host || '',
    port: initialData?.port || undefined as number | undefined,
    database: initialData?.database || '',
    healthCheckEndpoint: initialData?.healthCheckEndpoint || '',
  });

  const [auth, setAuth] = useState<AuthConfig>(
    initialData?.auth || { type: 'none' }
  );

  const [showSecrets, setShowSecrets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latency?: number;
    error?: string;
  } | null>(null);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value) : undefined) : value,
    }));
  };

  const handleAuthChange = (field: keyof AuthConfig, value: string) => {
    setAuth((prev) => ({ ...prev, [field]: value }));
  };

  const handleAuthTypeChange = (type: AuthenticationType) => {
    setAuth({ type });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setError('');

    try {
      const response = await fetch('/api/data-sources/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          auth,
        }),
      });

      const data = await response.json();
      setTestResult(data.data);
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : 'Test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const url = isEditing
        ? `/api/data-sources/${initialData.id}`
        : '/api/data-sources';

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          auth,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save data source');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/data-sources');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeIcons: Record<DataSourceType, React.ReactNode> = {
    rest: <Globe className="w-5 h-5" />,
    graphql: <Zap className="w-5 h-5" />,
    postgres: <Database className="w-5 h-5" />,
    mysql: <Database className="w-5 h-5" />,
    sqlite: <Database className="w-5 h-5" />,
    mongodb: <Database className="w-5 h-5" />,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="My API"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['rest', 'graphql'] as DataSourceType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type }))}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border
                            transition-colors ${
                              formData.type === type
                                ? 'bg-neutral-900 text-white border-neutral-900'
                                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                            }`}
                >
                  {typeIcons[type]}
                  <span className="text-sm font-medium uppercase">{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="Brief description of this data source"
            />
          </div>
        </div>
      </div>

      {/* Connection Settings */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Server className="w-5 h-5" />
          Connection Settings
        </h3>

        <div className="space-y-4">
          {/* Base URL (for REST/GraphQL) */}
          {(formData.type === 'rest' || formData.type === 'graphql') && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Base URL *
              </label>
              <input
                type="url"
                name="baseUrl"
                value={formData.baseUrl}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="https://api.example.com"
              />
            </div>
          )}

          {/* Health Check Endpoint */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Health Check Endpoint
            </label>
            <input
              type="text"
              name="healthCheckEndpoint"
              value={formData.healthCheckEndpoint}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="/health or /api/status"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Optional endpoint to check if the API is reachable
            </p>
          </div>
        </div>
      </div>

      {/* Authentication */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5" />
          Authentication
        </h3>

        {/* Auth Type Selection */}
        <div className="flex flex-wrap gap-2 mb-6">
          {([
            { value: 'none', label: 'None' },
            { value: 'api_key', label: 'API Key' },
            { value: 'bearer', label: 'Bearer Token' },
            { value: 'basic', label: 'Basic Auth' },
            { value: 'custom_header', label: 'Custom Headers' },
          ] as { value: AuthenticationType; label: string }[]).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleAuthTypeChange(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                auth.type === value
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Auth Type Specific Fields */}
        <div className="space-y-4">
          {auth.type === 'api_key' && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={auth.apiKey || ''}
                    onChange={(e) => handleAuthChange('apiKey', e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-neutral-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    placeholder="Your API key"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showSecrets ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Header Name
                  </label>
                  <input
                    type="text"
                    value={auth.apiKeyHeader || ''}
                    onChange={(e) => handleAuthChange('apiKeyHeader', e.target.value)}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    placeholder="X-API-Key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Prefix
                  </label>
                  <input
                    type="text"
                    value={auth.apiKeyPrefix || ''}
                    onChange={(e) => handleAuthChange('apiKeyPrefix', e.target.value)}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    placeholder="Bearer "
                  />
                </div>
              </div>
            </>
          )}

          {auth.type === 'bearer' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Bearer Token
              </label>
              <div className="relative">
                <input
                  type={showSecrets ? 'text' : 'password'}
                  value={auth.token || ''}
                  onChange={(e) => handleAuthChange('token', e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-neutral-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="Your bearer token"
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showSecrets ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {auth.type === 'basic' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={auth.username || ''}
                  onChange={(e) => handleAuthChange('username', e.target.value)}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="Username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={auth.password || ''}
                    onChange={(e) => handleAuthChange('password', e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-neutral-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showSecrets ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test Connection */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Test Connection
            </h3>
            <p className="text-sm text-neutral-500 mt-1">
              Verify the connection before saving
            </p>
          </div>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || !formData.baseUrl}
            className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-medium
                     hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center gap-2"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Test Connection
              </>
            )}
          </button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
              testResult.success
                ? 'bg-green-50 border border-green-100'
                : 'bg-red-50 border border-red-100'
            }`}
          >
            {testResult.success ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Connection successful</p>
                  {testResult.latency && (
                    <p className="text-sm text-green-600">
                      Response time: {testResult.latency}ms
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Connection failed</p>
                  <p className="text-sm text-red-600">{testResult.error}</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 text-neutral-700 font-medium hover:bg-neutral-100 rounded-lg"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-neutral-900 text-white font-medium rounded-lg
                   hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>{isEditing ? 'Update' : 'Create'} Data Source</>
          )}
        </button>
      </div>
    </form>
  );
}

export default DataSourceForm;
