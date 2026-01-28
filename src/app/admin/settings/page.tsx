'use client';

import { useState } from 'react';
import {
  Settings,
  Palette,
  Bell,
  Shield,
  Database,
  Globe,
  Save,
  Loader2,
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    general: {
      siteName: 'Admin Dashboard',
      siteDescription: 'Headless admin dashboard',
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
    },
    appearance: {
      theme: 'light',
      accentColor: '#000000',
      sidebarCompact: false,
    },
    notifications: {
      emailNotifications: true,
      browserNotifications: false,
      digestFrequency: 'daily',
    },
    security: {
      sessionTimeout: 30,
      requireMfa: false,
      allowPublicSignup: false,
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Simulate save
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaveMessage('Settings saved successfully');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
          <p className="text-neutral-500 mt-1">
            Configure your dashboard settings
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2.5 bg-neutral-900 text-white rounded-lg font-medium
                   hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div
          className={`px-4 py-3 rounded-lg ${
            saveMessage.includes('success')
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {saveMessage}
        </div>
      )}

      {/* Settings Content */}
      <div className="flex gap-6">
        {/* Tabs */}
        <div className="w-48 shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm
                          font-medium transition-colors
                          ${activeTab === tab.id
                            ? 'bg-neutral-900 text-white'
                            : 'text-neutral-700 hover:bg-neutral-100'
                          }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border border-neutral-200 p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-neutral-900">
                General Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.general.siteName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, siteName: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Site Description
                  </label>
                  <textarea
                    value={settings.general.siteDescription}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: {
                          ...settings.general,
                          siteDescription: e.target.value,
                        },
                      })
                    }
                    rows={2}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={settings.general.timezone}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          general: { ...settings.general, timezone: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Date Format
                    </label>
                    <select
                      value={settings.general.dateFormat}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          general: { ...settings.general, dateFormat: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-neutral-900">
                Appearance Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Theme
                  </label>
                  <div className="flex gap-3">
                    {['light', 'dark', 'system'].map((theme) => (
                      <button
                        key={theme}
                        onClick={() =>
                          setSettings({
                            ...settings,
                            appearance: { ...settings.appearance, theme },
                          })
                        }
                        className={`px-4 py-2.5 rounded-lg border text-sm font-medium
                                  ${settings.appearance.theme === theme
                                    ? 'bg-neutral-900 text-white border-neutral-900'
                                    : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                                  }`}
                      >
                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.appearance.accentColor}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appearance: {
                            ...settings.appearance,
                            accentColor: e.target.value,
                          },
                        })
                      }
                      className="w-12 h-12 rounded-lg border border-neutral-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.appearance.accentColor}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appearance: {
                            ...settings.appearance,
                            accentColor: e.target.value,
                          },
                        })
                      }
                      className="w-32 px-3 py-2 border border-neutral-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900">Compact Sidebar</p>
                    <p className="text-sm text-neutral-500">
                      Show icons only in sidebar
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        appearance: {
                          ...settings.appearance,
                          sidebarCompact: !settings.appearance.sidebarCompact,
                        },
                      })
                    }
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.appearance.sidebarCompact
                        ? 'bg-neutral-900'
                        : 'bg-neutral-200'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.appearance.sidebarCompact
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-neutral-900">
                Notification Settings
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900">Email Notifications</p>
                    <p className="text-sm text-neutral-500">
                      Receive notifications via email
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          emailNotifications: !settings.notifications.emailNotifications,
                        },
                      })
                    }
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.notifications.emailNotifications
                        ? 'bg-neutral-900'
                        : 'bg-neutral-200'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.notifications.emailNotifications
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900">Browser Notifications</p>
                    <p className="text-sm text-neutral-500">
                      Show desktop notifications
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          browserNotifications:
                            !settings.notifications.browserNotifications,
                        },
                      })
                    }
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.notifications.browserNotifications
                        ? 'bg-neutral-900'
                        : 'bg-neutral-200'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.notifications.browserNotifications
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-neutral-900">
                Security Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          sessionTimeout: parseInt(e.target.value) || 30,
                        },
                      })
                    }
                    className="w-32 px-4 py-2.5 border border-neutral-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900">Require MFA</p>
                    <p className="text-sm text-neutral-500">
                      Require two-factor authentication
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          requireMfa: !settings.security.requireMfa,
                        },
                      })
                    }
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.security.requireMfa
                        ? 'bg-neutral-900'
                        : 'bg-neutral-200'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.security.requireMfa
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900">Allow Public Signup</p>
                    <p className="text-sm text-neutral-500">
                      Allow users to create accounts
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          allowPublicSignup: !settings.security.allowPublicSignup,
                        },
                      })
                    }
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.security.allowPublicSignup
                        ? 'bg-neutral-900'
                        : 'bg-neutral-200'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.security.allowPublicSignup
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
