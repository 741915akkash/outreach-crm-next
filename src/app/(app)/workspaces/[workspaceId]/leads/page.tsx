'use client';

import { useMemo, useState } from 'react';
import { Search, MoreHorizontal, ArrowUpDown, Mail, Phone } from 'lucide-react';

type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Unqualified';

type Lead = {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  source: string;
  createdAt: string;
};

const mockLeads: Lead[] = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah@acme.com',
    phone: '+91 98765 43210',
    company: 'Acme Inc.',
    status: 'New',
    source: 'Website',
    createdAt: 'Nov 04, 2026',
  },
  {
    id: 2,
    name: 'Michael Chen',
    email: 'michael@techflow.io',
    phone: '+91 98765 12345',
    company: 'TechFlow',
    status: 'Contacted',
    source: 'LinkedIn',
    createdAt: 'Nov 03, 2026',
  },
  {
    id: 3,
    name: 'Emily Davis',
    email: 'emily@brightlabs.co',
    phone: '+91 98765 23456',
    company: 'Bright Labs',
    status: 'Qualified',
    source: 'Referral',
    createdAt: 'Nov 02, 2026',
  },
  {
    id: 4,
    name: 'James Wilson',
    email: 'james@novatech.com',
    phone: '+91 98765 34567',
    company: 'NovaTech',
    status: 'New',
    source: 'Website',
    createdAt: 'Nov 02, 2026',
  },
  {
    id: 5,
    name: 'Olivia Martinez',
    email: 'olivia@cloudbase.io',
    phone: '+91 98765 45678',
    company: 'CloudBase',
    status: 'Contacted',
    source: 'Cold outreach',
    createdAt: 'Nov 01, 2026',
  },
  {
    id: 6,
    name: 'Daniel Brown',
    email: 'daniel@pixelworks.com',
    phone: '+91 98765 56789',
    company: 'PixelWorks',
    status: 'Qualified',
    source: 'LinkedIn',
    createdAt: 'Oct 31, 2026',
  },
  {
    id: 7,
    name: 'Sophia Taylor',
    email: 'sophia@vertex.io',
    phone: '+91 98765 67890',
    company: 'Vertex',
    status: 'Unqualified',
    source: 'Website',
    createdAt: 'Oct 30, 2026',
  },
  {
    id: 8,
    name: 'William Anderson',
    email: 'william@orbit.com',
    phone: '+91 98765 78901',
    company: 'Orbit Systems',
    status: 'New',
    source: 'Referral',
    createdAt: 'Oct 29, 2026',
  },
];

const statusStyles: Record<LeadStatus, string> = {
  New: 'bg-blue-50 text-blue-700',
  Contacted: 'bg-amber-50 text-amber-700',
  Qualified: 'bg-emerald-50 text-emerald-700',
  Unqualified: 'bg-gray-100 text-gray-600',
};

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  const filteredLeads = useMemo(() => {
    return mockLeads.filter((lead) => {
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        lead.name.toLowerCase().includes(searchTerm) ||
        lead.email.toLowerCase().includes(searchTerm) ||
        lead.company.toLowerCase().includes(searchTerm);

      const matchesStatus =
        statusFilter === 'All' || lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Leads table */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Table toolbar */}
        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-semibold text-gray-900">All leads</h2>
            <p className="mt-1 text-xs text-gray-500">
              {filteredLeads.length} of {mockLeads.length} leads
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search leads..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-9 text-sm transition outline-none placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="All">All statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Unqualified">Unqualified</option>
            </select>
          </div>
        </div>

        {/* Responsive table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    Lead <ArrowUpDown className="size-3" />
                  </span>
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                  Company
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                  Status
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                  Source
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                  Created
                </th>
                <th className="w-12 px-5 py-3" />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="transition hover:bg-gray-50/70">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
                        {lead.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {lead.name}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="size-3" />
                          {lead.email}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                          <Phone className="size-3" />
                          {lead.phone}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-700">
                      {lead.company}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[lead.status]}`}
                    >
                      {lead.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {lead.source}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-500">
                    {lead.createdAt}
                  </td>

                  <td className="relative px-5 py-4">
                    <button
                      type="button"
                      aria-label={`Actions for ${lead.name}`}
                      onClick={() =>
                        setActiveMenu(activeMenu === lead.id ? null : lead.id)
                      }
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>

                    {activeMenu === lead.id && (
                      <div className="absolute top-10 right-8 z-10 w-32 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => setActiveMenu(null)}
                          className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          View details
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveMenu(null)}
                          className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Edit lead
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {filteredLeads.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    No leads match your search.
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
