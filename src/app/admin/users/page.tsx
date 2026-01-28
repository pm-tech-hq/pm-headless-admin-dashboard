'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
} from 'lucide-react';
import { SearchInput } from '@/components/search-filter';

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  userRoles: Array<{ role: { name: string } }>;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    // In production, fetch users from API
    setIsLoading(false);
    setUsers([
      {
        id: '1',
        name: 'Administrator',
        email: 'admin@example.com',
        isActive: true,
        isVerified: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        userRoles: [{ role: { name: 'admin' } }],
      },
    ]);
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      !search ||
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-2xl font-bold text-neutral-900">Users</h1>
          <p className="text-neutral-500 mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <button
          className="px-4 py-2.5 bg-neutral-900 text-white rounded-lg font-medium
                   hover:bg-neutral-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search users..."
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left px-6 py-3 text-xs font-medium text-neutral-500 uppercase">
                User
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-neutral-500 uppercase">
                Role
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-neutral-500 uppercase">
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-neutral-500 uppercase">
                Last Login
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-neutral-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-neutral-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-neutral-600">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{user.name}</p>
                      <p className="text-sm text-neutral-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-700">
                      {user.userRoles.map((ur) => ur.role.name).join(', ')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {user.isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      <XCircle className="w-3.5 h-3.5" />
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-neutral-500">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString()
                      : 'Never'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="relative inline-block">
                    <button
                      onClick={() =>
                        setMenuOpen(menuOpen === user.id ? null : user.id)
                      }
                      className="p-2 hover:bg-neutral-100 rounded-lg"
                    >
                      <MoreVertical className="w-4 h-4 text-neutral-500" />
                    </button>

                    {menuOpen === user.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg
                                    border border-neutral-200 py-1 min-w-[140px] z-10">
                        <button className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 w-full">
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
