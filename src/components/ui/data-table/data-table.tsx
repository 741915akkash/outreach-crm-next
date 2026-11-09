'use client';

import {
  useTable,
  tableFeatures,
  rowSortingFeature,
  createSortedRowModel,
  rowPaginationFeature,
  createPaginatedRowModel,
  rowSelectionFeature,
  columnVisibilityFeature,
} from '@tanstack/react-table';
import type {
  ColumnDef,
  RowData,
  SortingState,
  PaginationState,
  RowSelectionState,
  ColumnVisibilityState,
} from '@tanstack/react-table';

import { useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { DataTableToolbar } from './data-table-toolbar';
import type { ReactNode } from 'react';
import { DataTableSkeleton } from './data-table-skeleton';

export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature,
  columnVisibilityFeature,
});

type DataTableProps<TData extends RowData> = {
  data: TData[];
  columns: ColumnDef<typeof dataTableFeatures, TData>[];
  emptyMessage?: string;
  children?: ReactNode;
  loading?: boolean;
};

function compareDates<TData>(
  rowA: { getValue: (columnId: string) => unknown },
  rowB: { getValue: (columnId: string) => unknown },
  columnId: string,
) {
  const dateA = new Date(String(rowA.getValue(columnId))).getTime();
  const dateB = new Date(String(rowB.getValue(columnId))).getTime();

  return dateA - dateB;
}

export function DataTable<TData extends RowData>({
  data,
  columns,
  emptyMessage = 'No records found',
  children,
  loading,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const selectionColumn: ColumnDef<typeof dataTableFeatures, TData> = {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
        onClick={(event) => event.stopPropagation()}
        aria-label="Select all rows on this page"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        aria-label="Select row"
      />
    ),
  };

  function handleHeaderClick(column: ReturnType<typeof table.getAllColumns>[number]) {
    if (column.id === 'select') {
      table.toggleAllPageRowsSelected();
      return;
    }

    if (column.getCanSort()) {
      column.toggleSorting();
    }
  }

  function renderTableContent() {
    if (loading) {
      return <DataTableSkeleton rows={pagination.pageSize} columns={table.getVisibleLeafColumns().length} />;
    }

    const rows = table.getRowModel().rows;

    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan={table.getVisibleLeafColumns().length} className="px-5 py-12 text-center text-sm text-gray-500">
            {emptyMessage}
          </td>
        </tr>
      );
    }

    return rows.map((row) => (
      <tr key={row.id} className="transition hover:bg-gray-100">
        {row.getVisibleCells().map((cell) => (
          <td key={cell.id} className="px-5 py-4 text-sm text-gray-600">
            <table.FlexRender cell={cell} />
          </td>
        ))}
      </tr>
    ));
  }

  const table = useTable({
    features: dataTableFeatures,
    columns: [
      selectionColumn,
      ...columns.map((column) => {
        if ('accessorKey' in column && column.accessorKey === 'createdAt') {
          return {
            ...column,
            sortFn: compareDates,
          };
        }

        return column;
      }),
    ],
    data,
    state: {
      sorting,
      pagination,
      rowSelection,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
  });

  return (
    <div>
      <DataTableToolbar table={table}>{children}</DataTableToolbar>

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[850px] text-left">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers
                  .filter((header) => header.column.getIsVisible())
                  .map((header) => (
                    <th
                      key={header.id}
                      onClick={() => handleHeaderClick(header.column)}
                      className={`px-5 py-5 text-sm font-semibold text-gray-600 ${
                        header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                      }`}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center justify-center gap-1">
                          <table.FlexRender header={header} />

                          {header.column.getIsSorted() === 'asc' && <ArrowUp className="size-3.5 text-gray-900" />}

                          {header.column.getIsSorted() === 'desc' && <ArrowDown className="size-3.5 text-gray-900" />}
                        </div>
                      )}
                    </th>
                  ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-gray-100">{renderTableContent()}</tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Rows per page</span>

          <select
            value={pagination.pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700"
          >
            {[5, 10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>

          <span className="text-sm text-gray-500">
            Page {pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
