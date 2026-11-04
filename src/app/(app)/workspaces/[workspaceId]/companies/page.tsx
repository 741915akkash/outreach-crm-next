'use client';

import { useMemo, useState } from 'react';
import {
  Search,
  MoreHorizontal,
  ArrowUpDown,
  Building2,
  Globe,
} from 'lucide-react';

type Company = {
  id: number;
  name: string;
  website: string;
  industry: string;
  employees: string;
  location: string;
  createdAt: string;
};

const mockCompanies: Company[] = [
  {
    id: 1,
    name: 'Acme Technologies',
    website: 'acmetech.com',
    industry: 'Technology',
    employees: '51–200',
    location: 'Bengaluru, India',
    createdAt: 'Nov 02, 2026',
  },
  {
    id: 2,
    name: 'Northstar Labs',
    website: 'northstarlabs.io',
    industry: 'Software',
    employees: '11–50',
    location: 'New York, USA',
    createdAt: 'Oct 30, 2026',
  },
  {
    id: 3,
    name: 'Vertex Solutions',
    website: 'vertexsolutions.com',
    industry: 'Consulting',
    employees: '201–500',
    location: 'London, UK',
    createdAt: 'Oct 28, 2026',
  },
  {
    id: 4,
    name: 'Brightpath AI',
    website: 'brightpath.ai',
    industry: 'Artificial Intelligence',
    employees: '11–50',
    location: 'Delhi, India',
    createdAt: 'Oct 25, 2026',
  },
  {
    id: 5,
    name: 'Evergreen Ventures',
    website: 'evergreen.vc',
    industry: 'Financial Services',
    employees: '51–200',
    location: 'Mumbai, India',
    createdAt: 'Oct 22, 2026',
  },
  {
    id: 6,
    name: 'Pixelcraft Studio',
    website: 'pixelcraft.design',
    industry: 'Design',
    employees: '1–10',
    location: 'Pune, India',
    createdAt: 'Oct 19, 2026',
  },
  {
    id: 7,
    name: 'Cloudline Systems',
    website: 'cloudline.io',
    industry: 'Technology',
    employees: '51–200',
    location: 'San Francisco, USA',
    createdAt: 'Oct 16, 2026',
  },
];

export default function CompaniesPage() {
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All industries');
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  const filteredCompanies = useMemo(() => {
    return mockCompanies.filter((company) => {
      const matchesSearch =
        company.name.toLowerCase().includes(search.toLowerCase()) ||
        company.website.toLowerCase().includes(search.toLowerCase()) ||
        company.location.toLowerCase().includes(search.toLowerCase());

      const matchesIndustry =
        industryFilter === 'All industries' ||
        company.industry === industryFilter;

      return matchesSearch && matchesIndustry;
    });
  }, [search, industryFilter]);

  const industries = Array.from(
    new Set(mockCompanies.map((company) => company.industry)),
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-semibold text-gray-900">All companies</h2>
            <p className="mt-1 text-xs text-gray-500">
              {filteredCompanies.length} of {mockCompanies.length} companies
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search companies..."
                className="h-9 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-9 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:w-64"
              />
            </div>

            <select
              value={industryFilter}
              onChange={(event) => setIndustryFilter(event.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 transition outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option>All industries</option>
              {industries.map((industry) => (
                <option key={industry}>{industry}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Companies table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="px-5 py-3 text-xs font-medium text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    Company <ArrowUpDown className="size-3" />
                  </span>
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">
                  Industry
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">
                  Employees
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">
                  Location
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">
                  Date added
                </th>
                <th className="w-12 px-5 py-3" />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="transition hover:bg-gray-50/70">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500">
                        <Building2 className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {company.name}
                        </p>
                        <a
                          href={`https://${company.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-500 transition hover:text-emerald-700"
                        >
                          <Globe className="size-3" />
                          {company.website}
                        </a>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {company.industry}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {company.employees}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {company.location}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {company.createdAt}
                  </td>

                  <td className="relative px-5 py-4 text-right">
                    <button
                      type="button"
                      aria-label={`Actions for ${company.name}`}
                      onClick={() =>
                        setActiveMenu(
                          activeMenu === company.id ? null : company.id,
                        )
                      }
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>

                    {activeMenu === company.id && (
                      <div className="absolute top-12 right-8 z-10 w-36 rounded-lg border border-gray-200 bg-white p-1 text-left shadow-lg">
                        <button
                          type="button"
                          onClick={() => setActiveMenu(null)}
                          className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          View company
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveMenu(null)}
                          className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Edit company
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="text-sm font-medium text-gray-700">
                      No companies found
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Try adjusting your search or industry filter.
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
