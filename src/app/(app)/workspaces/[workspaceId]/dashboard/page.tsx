import {
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  Handshake,
  MoreHorizontal,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react';

const stats = [
  {
    label: 'Total leads',
    value: '1,284',
    change: '+12.8%',
    positive: true,
    icon: Users,
  },
  {
    label: 'Active deals',
    value: '48',
    change: '+8.2%',
    positive: true,
    icon: Handshake,
  },
  {
    label: 'Conversion rate',
    value: '24.8%',
    change: '-2.4%',
    positive: false,
    icon: TrendingUp,
  },
  {
    label: 'Tasks completed',
    value: '86',
    change: '+18.6%',
    positive: true,
    icon: Clock3,
  },
];

const recentLeads = [
  {
    name: 'Sarah Johnson',
    company: 'Acme Inc.',
    email: 'sarah@acme.com',
    status: 'New',
    date: 'Today',
  },
  {
    name: 'Michael Chen',
    company: 'TechFlow',
    email: 'michael@techflow.io',
    status: 'Contacted',
    date: 'Today',
  },
  {
    name: 'Emily Davis',
    company: 'Bright Labs',
    email: 'emily@brightlabs.co',
    status: 'Qualified',
    date: 'Yesterday',
  },
  {
    name: 'James Wilson',
    company: 'NovaTech',
    email: 'james@novatech.com',
    status: 'New',
    date: 'Yesterday',
  },
  {
    name: 'Olivia Martinez',
    company: 'CloudBase',
    email: 'olivia@cloudbase.io',
    status: 'Contacted',
    date: 'Oct 30',
  },
];

const statusStyles: Record<string, string> = {
  New: 'bg-blue-50 text-blue-700',
  Contacted: 'bg-amber-50 text-amber-700',
  Qualified: 'bg-emerald-50 text-emerald-700',
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-gray-500">Monday, November 3, 2026</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
            Good morning, Akash
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s what&apos;s happening with your workspace today.
          </p>
        </div>

        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700">
          <Plus className="size-4" />
          Add lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const ChangeIcon = stat.positive ? ArrowUpRight : ArrowDownRight;

          return (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">
                  {stat.label}
                </p>
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Icon className="size-[18px]" />
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <p className="text-2xl font-semibold tracking-tight text-gray-900 tabular-nums">
                  {stat.value}
                </p>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium ${stat.positive ? 'text-emerald-700' : 'text-red-600'}`}
                >
                  <ChangeIcon className="size-3.5" />
                  {stat.change}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Compared to last month
              </p>
            </div>
          );
        })}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Pipeline overview */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Pipeline overview
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Your deal performance this month
              </p>
            </div>
            <button className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700">
              <MoreHorizontal className="size-5" />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'New', value: '18', color: 'bg-blue-500', width: '75%' },
              {
                label: 'Qualified',
                value: '12',
                color: 'bg-violet-500',
                width: '55%',
              },
              {
                label: 'Proposal',
                value: '10',
                color: 'bg-amber-500',
                width: '45%',
              },
              {
                label: 'Won',
                value: '8',
                color: 'bg-emerald-500',
                width: '35%',
              },
            ].map((stage) => (
              <div key={stage.label}>
                <p className="text-sm text-gray-500">{stage.label}</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {stage.value}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${stage.color}`}
                    style={{ width: stage.width }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between rounded-lg bg-gray-50 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Total pipeline value
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Across all active deals
              </p>
            </div>
            <p className="text-xl font-semibold text-gray-900 tabular-nums">
              ₹12,45,000
            </p>
          </div>
        </section>

        {/* Tasks */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Upcoming tasks
              </h2>
              <p className="mt-1 text-sm text-gray-500">Your pending work</p>
            </div>
            <button className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
              View all
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {[
              {
                title: 'Follow up with Sarah',
                detail: 'Acme Inc. · 10:30 AM',
                color: 'border-emerald-500',
              },
              {
                title: 'Prepare proposal',
                detail: 'TechFlow · 1:00 PM',
                color: 'border-amber-500',
              },
              {
                title: 'Discovery call',
                detail: 'Bright Labs · 3:30 PM',
                color: 'border-blue-500',
              },
              {
                title: 'Send project details',
                detail: 'NovaTech · Tomorrow',
                color: 'border-violet-500',
              },
            ].map((task) => (
              <div
                key={task.title}
                className={`border-l-2 ${task.color} py-1 pl-3`}
              >
                <p className="text-sm font-medium text-gray-800">
                  {task.title}
                </p>
                <p className="mt-1 text-xs text-gray-500">{task.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Recent leads */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Recent leads
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Recently added contacts to your workspace
            </p>
          </div>
          <button className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            View all leads
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Company', 'Email', 'Status', 'Added'].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-5 py-3 text-xs font-semibold text-gray-500"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentLeads.map((lead) => (
                <tr key={lead.email} className="transition hover:bg-gray-50/70">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {lead.name}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {lead.company}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {lead.email}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[lead.status]}`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {lead.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
