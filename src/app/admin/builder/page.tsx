'use client';

import { useState, useCallback } from 'react';
import { DashboardBuilder } from '@/components/dashboard-builder';
import { Dashboard } from '@/components/dashboard-builder/types';

const defaultDashboard: Dashboard = {
  id: 'new-dashboard',
  name: 'New Dashboard',
  description: 'Create your custom dashboard',
  widgets: [],
  layouts: {
    lg: [],
    md: [],
    sm: [],
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function DashboardBuilderPage() {
  const [dashboard, setDashboard] = useState<Dashboard>(defaultDashboard);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleChange = useCallback((updatedDashboard: Dashboard) => {
    setDashboard(updatedDashboard);
    setSaveMessage(null);
  }, []);

  const handleSave = useCallback(async (dashboardToSave: Dashboard) => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Save to API
      const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: dashboardToSave.id,
          name: dashboardToSave.name,
          widgets: dashboardToSave.widgets,
          layouts: dashboardToSave.layouts,
        }),
      });

      if (response.ok) {
        setSaveMessage('Dashboard saved successfully');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage('Failed to save dashboard');
      }
    } catch (error) {
      setSaveMessage('Error saving dashboard');
    } finally {
      setIsSaving(false);
    }
  }, []);

  return (
    <div className="h-[calc(100vh-8rem)]">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard Builder</h1>
          <p className="text-neutral-500 mt-1">
            Drag and drop widgets to create your custom dashboard
          </p>
        </div>
        {saveMessage && (
          <div
            className={`px-4 py-2 rounded-lg text-sm ${
              saveMessage.includes('success')
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {saveMessage}
          </div>
        )}
      </div>

      {/* Dashboard Builder */}
      <div className="h-[calc(100%-4rem)] bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <DashboardBuilder
          dashboard={dashboard}
          onChange={handleChange}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
