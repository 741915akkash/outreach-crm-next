'use client';

import { useMemo, useState } from 'react';
import { Search, MoreHorizontal, Building2, Globe } from 'lucide-react';

import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, dataTableFeatures } from '@/components/ui/data-table/data-table';

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

  const columns: ColumnDef<typeof dataTableFeatures, Company>[] = [
    {
      accessorKey: 'name',
      header: 'Company',
      enableSorting: true,
      cell: ({ row }) => {
        const company = row.original;

        return (
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{company.name}</p>

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
        );
      },
    },
    {
      accessorKey: 'industry',
      header: 'Industry',
      enableSorting: true,
    },
    {
      accessorKey: 'employees',
      header: 'Employees',
      enableSorting: true,
      sortFn: (rowA, rowB) => {
        const employeesA = Number(rowA.original.employees.split('–')[0]);
        const employeesB = Number(rowB.original.employees.split('–')[0]);

        return employeesA - employeesB;
      },
    },
    {
      accessorKey: 'location',
      header: 'Location',
      enableSorting: true,
    },
    {
      accessorKey: 'createdAt',
      header: 'Date added',
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const company = row.original;

        return (
          <div className="relative">
            <button
              type="button"
              aria-label={`Actions for ${company.name}`}
              onClick={() => setActiveMenu(activeMenu === company.id ? null : company.id)}
              className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <MoreHorizontal className="size-4" />
            </button>

            {activeMenu === company.id && (
              <div className="absolute top-10 right-8 z-10 w-36 rounded-lg border border-gray-200 bg-white p-1 text-left shadow-lg">
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
          </div>
        );
      },
    },
  ];

  const filteredCompanies = useMemo(() => {
    return mockCompanies.filter((company) => {
      const matchesSearch =
        company.name.toLowerCase().includes(search.toLowerCase()) ||
        company.website.toLowerCase().includes(search.toLowerCase()) ||
        company.location.toLowerCase().includes(search.toLowerCase());

      const matchesIndustry = industryFilter === 'All industries' || company.industry === industryFilter;

      return matchesSearch && matchesIndustry;
    });
  }, [search, industryFilter]);

  const industries = Array.from(new Set(mockCompanies.map((company) => company.industry)));

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Companies table */}
        <div className="w-full min-w-0">
          <DataTable
            data={filteredCompanies}
            columns={columns}
            emptyMessage="No companies match your search or industry filter"
          >
            {/* Search */}
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

            {/* Industry filter */}
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
          </DataTable>
        </div>
      </section>
    </div>
  );
}
