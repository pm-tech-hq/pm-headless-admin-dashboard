'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Database,
  FileJson,
  Users,
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface DashboardStats {
  dataSources: { total: number; healthy: number; unhealthy: number };
  schemas: { total: number; recentlyUpdated: number };
  users: { total: number; activeToday: number };
  activity: { recentActions: number };
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading stats - in production, fetch from API
    const loadStats = async () => {
      try {
        // Fetch data source stats
        const dsResponse = await fetch('/api/data-sources');
        const dsData = await dsResponse.json();
        const dataSources = dsData.success ? dsData.data : [];

        setStats({
          dataSources: {
            total: dataSources.length,
            healthy: dataSources.filter((ds: { healthStatus: string }) => ds.healthStatus === 'healthy').length,
            unhealthy: dataSources.filter((ds: { healthStatus: string }) => ds.healthStatus === 'unhealthy').length,
          },
          schemas: { total: 0, recentlyUpdated: 0 },
          users: { total: 1, activeToday: 1 },
          activity: { recentActions: 0 },
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
        setStats({
          dataSources: { total: 0, healthy: 0, unhealthy: 0 },
          schemas: { total: 0, recentlyUpdated: 0 },
          users: { total: 0, activeToday: 0 },
          activity: { recentActions: 0 },
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Data Sources',
      value: stats?.dataSources.total || 0,
      change: `${stats?.dataSources.healthy || 0} healthy`,
      icon: Database,
      color: 'bg-blue-500',
      href: '/admin/data-sources',
    },
    {
      title: 'Schemas',
      value: stats?.schemas.total || 0,
      change: `${stats?.schemas.recentlyUpdated || 0} updated recently`,
      icon: FileJson,
      color: 'bg-emerald-500',
      href: '/admin/schemas',
    },
    {
      title: 'Users',
      value: stats?.users.total || 0,
      change: `${stats?.users.activeToday || 0} active today`,
      icon: Users,
      color: 'bg-purple-500',
      href: '/admin/users',
    },
    {
      title: 'Recent Activity',
      value: stats?.activity.recentActions || 0,
      change: 'actions today',
      icon: Activity,
      color: 'bg-orange-500',
      href: '/admin/activity',
    },
  ];

  const quickActions = [
    {
      title: 'Add Data Source',
      description: 'Connect a new API or database',
      href: '/admin/data-sources/new',
      icon: Database,
    },
    {
      title: 'Build Dashboard',
      description: 'Create a custom dashboard',
      href: '/admin/builder',
      icon: TrendingUp,
    },
    {
      title: 'View Schemas',
      description: 'Manage detected schemas',
      href: '/admin/schemas',
      icon: FileJson,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Admin Overview</h1>
        <p className="text-neutral-500 mt-1">
          Monitor and manage your admin dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="bg-white rounded-xl border border-neutral-200 p-5
                     hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-500">{stat.title}</p>
                <p className="text-3xl font-bold text-neutral-900 mt-1">
                  {stat.value}
                </p>
                <p className="text-xs text-neutral-400 mt-1">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="flex flex-col items-center p-4 rounded-xl border border-neutral-200
                         hover:border-neutral-900 hover:bg-neutral-50 transition-colors text-center"
              >
                <action.icon className="w-8 h-8 text-neutral-700 mb-3" />
                <h3 className="font-medium text-neutral-900">{action.title}</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            System Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700">API Online</span>
              </div>
              <span className="text-xs text-green-600">Healthy</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700">Database</span>
              </div>
              <span className="text-xs text-green-600">Connected</span>
            </div>
            {stats?.dataSources.unhealthy ? (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-yellow-700">Data Sources</span>
                </div>
                <span className="text-xs text-yellow-600">
                  {stats.dataSources.unhealthy} issues
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Recent Activity
          </h2>
          <Link
            href="/admin/activity"
            className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="text-center py-8 text-neutral-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
          <p>No recent activity</p>
          <p className="text-sm text-neutral-400 mt-1">
            Activity will appear here as you use the dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
