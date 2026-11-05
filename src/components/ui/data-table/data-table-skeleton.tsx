type DataTableSkeletonProps = {
  rows?: number;
  columns?: number;
};

export function DataTableSkeleton({ rows = 5, columns = 5 }: DataTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <td key={columnIndex} className="px-5 py-5">
              <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
