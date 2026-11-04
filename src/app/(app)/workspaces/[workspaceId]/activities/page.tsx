'use client';

import { useMemo, useState } from 'react';
import {
  Search,
  Phone,
  Mail,
  CalendarDays,
  FileText,
  CheckSquare,
  Filter,
} from 'lucide-react';

type ActivityType = 'Call' | 'Email' | 'Meeting' | 'Note' | 'Task';

type Activity = {
  id: number;
  type: ActivityType;
  title: string;
  description: string;
  lead: string;
  deal: string;
  company: string;
  task: string;
  user: string;
  date: string;
  time: string;
};

const mockActivities: Activity[] = [
  {
    id: 1,
    type: 'Call',
    title: 'Discovery call completed',
    description:
      'Discussed project requirements, budget, and expected timeline.',
    lead: '',
    deal: '',
    company: 'Acme Technologies',
    task: '',
    user: 'Akash Saini',
    date: 'Today',
    time: '10:45 AM',
  },
  {
    id: 2,
    type: 'Email',
    title: 'Proposal email sent',
    description:
      'Sent the initial project proposal with pricing and deliverables.',
    lead: '',
    deal: '',
    company: 'Northstar Labs',
    task: '',
    user: 'Priya Mehta',
    date: 'Today',
    time: '9:30 AM',
  },
  {
    id: 3,
    type: 'Meeting',
    title: 'Product demo scheduled',
    description: 'Product demonstration scheduled for next week.',
    lead: 'Ananya Verma',
    deal: '',
    company: '',
    task: '',
    user: 'Akash Saini',
    date: 'Yesterday',
    time: '4:15 PM',
  },
  {
    id: 4,
    type: 'Note',
    title: 'Client requirements updated',
    description:
      'Client prefers an MVP launch within five weeks. Budget is still under discussion.',
    lead: '',
    deal: '',
    company: 'Brightpath AI',
    task: '',
    user: 'Priya Mehta',
    date: 'Yesterday',
    time: '2:20 PM',
  },
  {
    id: 5,
    type: 'Task',
    title: 'Follow-up completed',
    description: 'Followed up regarding the pending project proposal.',
    lead: '',
    deal: 'Vertex Solutions',
    company: '',
    task: 'Follow up on project proposal',
    user: 'Akash Saini',
    date: 'Yesterday',
    time: '11:00 AM',
  },
  {
    id: 6,
    type: 'Call',
    title: 'Initial contact',
    description:
      'Introduced our services and discussed potential collaboration.',
    lead: 'David Wilson',
    deal: '',
    company: '',
    task: '',
    user: 'Priya Mehta',
    date: 'Nov 02, 2026',
    time: '3:30 PM',
  },
  {
    id: 7,
    type: 'Email',
    title: 'Introduction email sent',
    description: 'Shared company profile and service overview.',
    lead: '',
    deal: '',
    company: 'Evergreen Ventures',
    task: '',
    user: 'Akash Saini',
    date: 'Nov 02, 2026',
    time: '10:15 AM',
  },
];

const activityConfig: Record<
  ActivityType,
  { icon: typeof Phone; iconStyle: string }
> = {
  Call: {
    icon: Phone,
    iconStyle: 'bg-emerald-50 text-emerald-700',
  },
  Email: {
    icon: Mail,
    iconStyle: 'bg-blue-50 text-blue-700',
  },
  Meeting: {
    icon: CalendarDays,
    iconStyle: 'bg-violet-50 text-violet-700',
  },
  Note: {
    icon: FileText,
    iconStyle: 'bg-amber-50 text-amber-700',
  },
  Task: {
    icon: CheckSquare,
    iconStyle: 'bg-gray-100 text-gray-700',
  },
};

const activityTypes: ActivityType[] = [
  'Call',
  'Email',
  'Meeting',
  'Note',
  'Task',
];

export default function ActivitiesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All activities');

  const filteredActivities = useMemo(() => {
    return mockActivities.filter((activity) => {
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        activity.title.toLowerCase().includes(searchTerm) ||
        activity.description.toLowerCase().includes(searchTerm) ||
        activity.lead.toLowerCase().includes(searchTerm) ||
        activity.deal.toLowerCase().includes(searchTerm) ||
        activity.company.toLowerCase().includes(searchTerm) ||
        activity.task.toLowerCase().includes(searchTerm) ||
        activity.user.toLowerCase().includes(searchTerm);

      const matchesType =
        typeFilter === 'All activities' || activity.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [search, typeFilter]);

  const groupedActivities = useMemo(() => {
    return filteredActivities.reduce<Record<string, Activity[]>>(
      (groups, activity) => {
        if (!groups[activity.date]) {
          groups[activity.date] = [];
        }

        groups[activity.date].push(activity);

        return groups;
      },
      {},
    );
  }, [filteredActivities]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Timeline toolbar */}
        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-semibold text-gray-900">Activity timeline</h2>

            <p className="mt-1 text-xs text-gray-500">
              {filteredActivities.length} activities
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search activities..."
                className="h-9 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-9 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:w-64"
              />
            </div>

            <div className="relative">
              <Filter className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />

              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="h-9 w-full appearance-none rounded-lg border border-gray-200 bg-white pr-8 pl-9 text-sm text-gray-700 transition outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:w-44"
              >
                <option>All activities</option>

                {activityTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Activity timeline */}
        <div className="p-5 sm:p-7">
          {Object.keys(groupedActivities).length > 0 ? (
            <div className="mx-auto w-full max-w-2xl space-y-8">
              {Object.entries(groupedActivities).map(([date, activities]) => (
                <section key={date}>
                  {/* Date heading */}
                  <div className="mb-5 flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {date}
                    </h3>

                    <div className="h-px flex-1 bg-gray-100" />

                    <span className="text-xs text-gray-400">
                      {activities.length}{' '}
                      {activities.length === 1 ? 'activity' : 'activities'}
                    </span>
                  </div>

                  {/* Timeline items */}
                  <div className="ml-4 border-l border-gray-200">
                    {activities.map((activity) => {
                      const config = activityConfig[activity.type];
                      const Icon = config.icon;

                      const relationships = [
                        { label: 'Lead', value: activity.lead },
                        { label: 'Deal', value: activity.deal },
                        { label: 'Company', value: activity.company },
                        { label: 'Task', value: activity.task },
                      ];

                      return (
                        <article
                          key={activity.id}
                          className="relative pb-7 pl-8 last:pb-0"
                        >
                          {/* Timeline marker */}
                          <div className="absolute top-0 -left-[17px] flex size-8 items-center justify-center rounded-full border-4 border-white bg-gray-100">
                            <div className="size-2 rounded-full bg-gray-400" />
                          </div>

                          {/* Activity card */}
                          <div className="rounded-xl border border-gray-100 bg-white p-4 transition hover:border-gray-200 hover:shadow-sm sm:p-5">
                            {/* Activity heading */}
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${config.iconStyle}`}
                              >
                                <Icon className="size-4" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-semibold text-gray-900">
                                    {activity.title}
                                  </h4>

                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                    {activity.type}
                                  </span>
                                </div>

                                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                                  {activity.description}
                                </p>

                                <p className="mt-2 text-xs text-gray-400">
                                  {activity.time} · {activity.user}
                                </p>
                              </div>
                            </div>

                            {/* CRM relationships - vertical layout */}
                            <div className="mt-5 space-y-4 rounded-lg bg-gray-50 p-4">
                              {relationships.map((item) => (
                                <div key={item.label}>
                                  <p className="text-xs font-medium text-gray-400">
                                    {item.label}
                                  </p>

                                  <p className="mt-1 min-h-5 text-sm font-medium text-gray-700">
                                    {item.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-gray-700">
                No activities found
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Try adjusting your search or activity filter.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
