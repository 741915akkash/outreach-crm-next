import type { ReactNode } from 'react';
import type { ReactTable, RowData } from '@tanstack/react-table';
import type { dataTableFeatures } from './data-table';
import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

type DataTableToolbarProps<TData extends RowData> = {
  children?: ReactNode;
  table: ReactTable<typeof dataTableFeatures, TData>;
};

export function DataTableToolbar<TData extends RowData>({ children, table }: DataTableToolbarProps<TData>) {
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <div className="flex min-w-0 items-center gap-3">{children}</div>

      {/* Column visibility control */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowColumnMenu((current) => !current)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <SlidersHorizontal className="size-4" />
          Columns
        </button>

        {showColumnMenu && (
          <div className="absolute top-full right-0 z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
            {table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <label
                  key={column.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                    className="size-4"
                  />
                  <span>{column.id}</span>
                </label>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
