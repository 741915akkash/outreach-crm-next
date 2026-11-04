'use client';

import { useMemo, useState } from 'react';
import { Search, MoreHorizontal, ArrowUpDown, Handshake } from 'lucide-react';

type DealStage =
  'New' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

type Deal = {
  id: number;
  name: string;
  company: string;
  contact: string;
  stage: DealStage;
  value: number;
  expectedCloseDate: string;
  owner: string;
};

const mockDeals: Deal[] = [
  {
    id: 1,
    name: 'CRM Implementation',
    company: 'Acme Technologies',
    contact: 'Rahul Sharma',
    stage: 'New',
    value: 4500,
    expectedCloseDate: 'Nov 20, 2026',
    owner: 'Akash Saini',
  },
  {
    id: 2,
    name: 'AI Automation Platform',
    company: 'Northstar Labs',
    contact: 'Sarah Johnson',
    stage: 'Qualified',
    value: 12000,
    expectedCloseDate: 'Nov 15, 2026',
    owner: 'Akash Saini',
  },
  {
    id: 3,
    name: 'Website Redesign',
    company: 'Vertex Solutions',
    contact: 'Michael Brown',
    stage: 'Proposal',
    value: 6500,
    expectedCloseDate: 'Nov 25, 2026',
    owner: 'Priya Mehta',
  },
  {
    id: 4,
    name: 'MVP Development',
    company: 'Brightpath AI',
    contact: 'Ananya Verma',
    stage: 'Negotiation',
    value: 18000,
    expectedCloseDate: 'Dec 05, 2026',
    owner: 'Akash Saini',
  },
  {
    id: 5,
    name: 'Product Consulting',
    company: 'Evergreen Ventures',
    contact: 'David Wilson',
    stage: 'Won',
    value: 8000,
    expectedCloseDate: 'Nov 10, 2026',
    owner: 'Priya Mehta',
  },
  {
    id: 6,
    name: 'Mobile App Development',
    company: 'Pixelcraft Studio',
    contact: 'Emma Davis',
    stage: 'Lost',
    value: 9500,
    expectedCloseDate: 'Nov 08, 2026',
    owner: 'Akash Saini',
  },
  {
    id: 7,
    name: 'Cloud Migration',
    company: 'Cloudline Systems',
    contact: 'James Miller',
    stage: 'Qualified',
    value: 15000,
    expectedCloseDate: 'Dec 12, 2026',
    owner: 'Priya Mehta',
  },
];

const stageStyles: Record<DealStage, string> = {
  New: 'bg-gray-100 text-gray-700',
  Qualified: 'bg-blue-50 text-blue-700',
  Proposal: 'bg-violet-50 text-violet-700',
  Negotiation: 'bg-amber-50 text-amber-700',
  Won: 'bg-emerald-50 text-emerald-700',
  Lost: 'bg-red-50 text-red-700',
};

const stages: DealStage[] = [
  'New',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
];

export default function DealsPage() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All stages');
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  const filteredDeals = useMemo(() => {
    return mockDeals.filter((deal) => {
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        deal.name.toLowerCase().includes(searchTerm) ||
        deal.company.toLowerCase().includes(searchTerm) ||
        deal.contact.toLowerCase().includes(searchTerm);

      const matchesStage =
        stageFilter === 'All stages' || deal.stage === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [search, stageFilter]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-semibold text-gray-900">All deals</h2>
            <p className="mt-1 text-xs text-gray-500">
              {filteredDeals.length} of {mockDeals.length} deals
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search deals..."
                className="h-9 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-9 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:w-64"
              />
            </div>

            <select
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 transition outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option>All stages</option>
              {stages.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Deals table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="px-5 py-3 text-xs font-medium text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    Deal <ArrowUpDown className="size-3" />
                  </span>
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">
                  Company
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">
                  Contact
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">
                  Stage
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">
                  Value
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">
                  Expected close
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">
                  Owner
                </th>
                <th className="w-12 px-5 py-3" />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredDeals.map((deal) => (
                <tr key={deal.id} className="transition hover:bg-gray-50/70">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500">
                        <Handshake className="size-4" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {deal.name}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {deal.company}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {deal.contact}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${stageStyles[deal.stage]}`}
                    >
                      {deal.stage}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm font-medium text-gray-900 tabular-nums">
                    {formatCurrency(deal.value)}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-500">
                    {deal.expectedCloseDate}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {deal.owner}
                  </td>

                  <td className="relative px-5 py-4 text-right">
                    <button
                      type="button"
                      aria-label={`Actions for ${deal.name}`}
                      onClick={() =>
                        setActiveMenu(activeMenu === deal.id ? null : deal.id)
                      }
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>

                    {activeMenu === deal.id && (
                      <div className="absolute top-12 right-8 z-10 w-36 rounded-lg border border-gray-200 bg-white p-1 text-left shadow-lg">
                        <button
                          type="button"
                          onClick={() => setActiveMenu(null)}
                          className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          View deal
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveMenu(null)}
                          className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Edit deal
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {filteredDeals.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <p className="text-sm font-medium text-gray-700">
                      No deals found
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Try adjusting your search or stage filter.
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
