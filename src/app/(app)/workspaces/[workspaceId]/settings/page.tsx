'use client';

import { useState } from 'react';
import {
  Building2,
  Users,
  UserRound,
  Bell,
  ShieldCheck,
  ChevronRight,
  Camera,
  Save,
  Mail,
  Lock,
} from 'lucide-react';

type SettingsSection =
  'workspace' | 'members' | 'profile' | 'preferences' | 'security';

const settingsNavigation = [
  {
    id: 'workspace' as const,
    label: 'Workspace',
    description: 'General workspace information',
    icon: Building2,
  },
  {
    id: 'members' as const,
    label: 'Members',
    description: 'Manage members and roles',
    icon: Users,
  },
  {
    id: 'profile' as const,
    label: 'My profile',
    description: 'Personal account information',
    icon: UserRound,
  },
  {
    id: 'preferences' as const,
    label: 'Preferences',
    description: 'Notifications and preferences',
    icon: Bell,
  },
  {
    id: 'security' as const,
    label: 'Security',
    description: 'Password and account security',
    icon: ShieldCheck,
  },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>('workspace');

  const [workspaceName, setWorkspaceName] = useState('Acme Workspace');
  const [workspaceDescription, setWorkspaceDescription] = useState(
    'Our team workspace for managing customer relationships.',
  );

  const [profileName, setProfileName] = useState('Akash Saini');
  const [profileEmail, setProfileEmail] = useState('akash@example.com');

  const [notifications, setNotifications] = useState({
    email: true,
    taskReminders: true,
    dealUpdates: false,
    memberUpdates: true,
  });

  const activeNavigation = settingsNavigation.find(
    (item) => item.id === activeSection,
  );

  const handleSave = () => {
    // UI-only for now. API integration will be added later.
    alert('Settings saved locally for this demo.');
  };

  return (
    <div className="space-y-6">
      {/* Page introduction */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your workspace and account preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        {/* Settings navigation */}
        <aside className="h-fit rounded-xl border border-gray-200 bg-white p-2">
          <nav className="space-y-1">
            {settingsNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon
                    className={`size-5 shrink-0 ${
                      isActive ? 'text-emerald-700' : 'text-gray-400'
                    }`}
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {item.label}
                    </span>
                    <span
                      className={`mt-0.5 block text-xs ${
                        isActive ? 'text-emerald-700' : 'text-gray-400'
                      }`}
                    >
                      {item.description}
                    </span>
                  </span>

                  <ChevronRight
                    className={`size-4 shrink-0 ${
                      isActive ? 'text-emerald-600' : 'text-gray-300'
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Settings content */}
        <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* Section header */}
          <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
            <h3 className="text-base font-semibold text-gray-900">
              {activeNavigation?.label}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeNavigation?.description}
            </p>
          </div>

          {/* Workspace */}
          {activeSection === 'workspace' && (
            <div className="space-y-6 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl font-bold text-emerald-700">
                  A
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Workspace logo
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Upload an image to represent your workspace.
                  </p>

                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <Camera className="size-3.5" />
                    Change logo
                  </button>
                </div>
              </div>

              <div className="max-w-xl space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Workspace name
                  </label>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(event) => setWorkspaceName(event.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 transition outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={workspaceDescription}
                    onChange={(event) =>
                      setWorkspaceDescription(event.target.value)
                    }
                    className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm text-gray-900 transition outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Workspace URL
                  </label>
                  <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
                    app.outreachcrm.com/acme-workspace
                  </div>
                  <p className="text-xs text-gray-400">
                    Your workspace URL is used to identify your workspace.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Members */}
          {activeSection === 'members' && (
            <div className="p-5 sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Workspace members
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Manage who has access to this workspace.
                  </p>
                </div>

                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  Invite member
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-3 pr-4 text-xs font-medium text-gray-500">
                        Member
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">
                        Role
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {[
                      {
                        name: 'Akash Saini',
                        email: 'akash@example.com',
                        initials: 'AS',
                        role: 'Owner',
                        status: 'Active',
                      },
                      {
                        name: 'Priya Mehta',
                        email: 'priya@example.com',
                        initials: 'PM',
                        role: 'Admin',
                        status: 'Active',
                      },
                      {
                        name: 'Rahul Sharma',
                        email: 'rahul@example.com',
                        initials: 'RS',
                        role: 'Member',
                        status: 'Invited',
                      },
                    ].map((member) => (
                      <tr key={member.email}>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                              {member.initials}
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {member.name}
                              </p>
                              <p className="mt-0.5 text-xs text-gray-500">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-600">
                          {member.role}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              member.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {member.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Profile */}
          {activeSection === 'profile' && (
            <div className="space-y-6 p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700">
                  AS
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Profile photo
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Your photo is visible to workspace members.
                  </p>
                </div>
              </div>

              <div className="max-w-xl space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(event) => setProfileEmail(event.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Preferences */}
          {activeSection === 'preferences' && (
            <div className="divide-y divide-gray-100">
              {[
                {
                  id: 'email',
                  title: 'Email notifications',
                  description: 'Receive important workspace updates by email.',
                },
                {
                  id: 'taskReminders',
                  title: 'Task reminders',
                  description: 'Get notified about upcoming task deadlines.',
                },
                {
                  id: 'dealUpdates',
                  title: 'Deal updates',
                  description:
                    'Receive notifications when deals change stages.',
                },
                {
                  id: 'memberUpdates',
                  title: 'Member updates',
                  description: 'Get notified when members join your workspace.',
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {item.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={
                      notifications[item.id as keyof typeof notifications]
                    }
                    onClick={() =>
                      setNotifications((current) => ({
                        ...current,
                        [item.id]: !current[item.id as keyof typeof current],
                      }))
                    }
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                      notifications[item.id as keyof typeof notifications]
                        ? 'bg-emerald-600'
                        : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition ${
                        notifications[item.id as keyof typeof notifications]
                          ? 'left-6'
                          : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Security */}
          {activeSection === 'security' && (
            <div className="space-y-6 p-5 sm:p-6">
              <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Account security
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    Keep your account secure by using a strong password and
                    protecting your sign-in credentials.
                  </p>
                </div>
              </div>

              <div className="max-w-xl space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Current password
                  </label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      placeholder="Enter current password"
                      className="h-10 w-full rounded-lg border border-gray-200 pr-3 pl-10 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    New password
                  </label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="h-10 w-full rounded-lg border border-gray-200 pr-3 pl-10 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="h-10 w-full rounded-lg border border-gray-200 pr-3 pl-10 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end border-t border-gray-100 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              <Save className="size-4" />
              Save changes
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
