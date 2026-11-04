'use client';

import { useMemo, useState } from 'react';
import { Search, MoreHorizontal, ArrowUpDown, CheckSquare } from 'lucide-react';

type TaskStatus = 'To do' | 'In progress' | 'Completed';
type TaskPriority = 'Low' | 'Medium' | 'High';

type Task = {
  id: number;
  title: string;
  relatedTo: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string;
};

const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Follow up with Acme Technologies',
    relatedTo: 'Acme Technologies',
    dueDate: 'Nov 05, 2026',
    priority: 'High',
    status: 'To do',
    assignee: 'Akash Saini',
  },
  {
    id: 2,
    title: 'Prepare project proposal',
    relatedTo: 'Northstar Labs',
    dueDate: 'Nov 06, 2026',
    priority: 'High',
    status: 'In progress',
    assignee: 'Priya Mehta',
  },
  {
    id: 3,
    title: 'Schedule product demo',
    relatedTo: 'Brightpath AI',
    dueDate: 'Nov 07, 2026',
    priority: 'Medium',
    status: 'To do',
    assignee: 'Akash Saini',
  },
  {
    id: 4,
    title: 'Send contract for review',
    relatedTo: 'Vertex Solutions',
    dueDate: 'Nov 08, 2026',
    priority: 'High',
    status: 'In progress',
    assignee: 'Priya Mehta',
  },
  {
    id: 5,
    title: 'Update company information',
    relatedTo: 'Evergreen Ventures',
    dueDate: 'Nov 09, 2026',
    priority: 'Low',
    status: 'Completed',
    assignee: 'Akash Saini',
  },
  {
    id: 6,
    title: 'Research potential partnership',
    relatedTo: 'Pixelcraft Studio',
    dueDate: 'Nov 10, 2026',
    priority: 'Medium',
    status: 'To do',
    assignee: 'Priya Mehta',
  },
  {
    id: 7,
    title: 'Review project requirements',
    relatedTo: 'Cloudline Systems',
    dueDate: 'Nov 11, 2026',
    priority: 'Medium',
    status: 'Completed',
    assignee: 'Akash Saini',
  },
];

const statusStyles: Record<TaskStatus, string> = {
  'To do': 'bg-gray-100 text-gray-700',
  'In progress': 'bg-blue-50 text-blue-700',
  Completed: 'bg-emerald-50 text-emerald-700',
};

const priorityStyles: Record<TaskPriority, string> = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-amber-50 text-amber-700',
  High: 'bg-red-50 text-red-700',
};

const statuses: TaskStatus[] = ['To do', 'In progress', 'Completed'];
const priorities: TaskPriority[] = ['Low', 'Medium', 'High'];

export default function TasksPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [priorityFilter, setPriorityFilter] = useState('All priorities');
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  const filteredTasks = useMemo(() => {
    return mockTasks.filter((task) => {
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm) ||
        task.relatedTo.toLowerCase().includes(searchTerm) ||
        task.assignee.toLowerCase().includes(searchTerm);

      const matchesStatus =
        statusFilter === 'All statuses' || task.status === statusFilter;

      const matchesPriority =
        priorityFilter === 'All priorities' || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [search, statusFilter, priorityFilter]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-semibold text-gray-900">All tasks</h2>
            <p className="mt-1 text-xs text-gray-500">
              {filteredTasks.length} of {mockTasks.length} tasks
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks..."
                className="h-9 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-9 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 transition outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option>All statuses</option>
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 transition outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option>All priorities</option>
              {priorities.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tasks table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="px-5 py-3 text-xs font-medium text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    Task <ArrowUpDown className="size-3" />
                  </span>
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">
                  Related to
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">
                  Due date
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">
                  Priority
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">
                  Status
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">
                  Assignee
                </th>
                <th className="w-12 px-5 py-3" />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="transition hover:bg-gray-50/70">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500">
                        <CheckSquare className="size-4" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {task.title}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {task.relatedTo}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-500">
                    {task.dueDate}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${priorityStyles[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[task.status]}`}
                    >
                      {task.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {task.assignee}
                  </td>

                  <td className="relative px-5 py-4 text-right">
                    <button
                      type="button"
                      aria-label={`Actions for ${task.title}`}
                      onClick={() =>
                        setActiveMenu(activeMenu === task.id ? null : task.id)
                      }
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>

                    {activeMenu === task.id && (
                      <div className="absolute top-12 right-8 z-10 w-36 rounded-lg border border-gray-200 bg-white p-1 text-left shadow-lg">
                        <button
                          type="button"
                          onClick={() => setActiveMenu(null)}
                          className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          View task
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveMenu(null)}
                          className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Edit task
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <p className="text-sm font-medium text-gray-700">
                      No tasks found
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Try adjusting your search or filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
