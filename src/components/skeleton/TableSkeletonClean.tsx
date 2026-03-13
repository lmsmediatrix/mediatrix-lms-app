interface ColumnConfig {
  width: string;
  hasAvatar?: boolean; // For first column with avatar
  alignment?: 'left' | 'center' | 'right';
}

interface TableSkeletonCleanProps {
  columns: ColumnConfig[];
  rows?: number;
  className?: string;
}

export default function TableSkeletonClean({ 
  columns, 
  rows = 3, 
  className = "" 
}: TableSkeletonCleanProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse min-w-[640px]">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="text-left p-4"
                  style={{ width: column.width }}
                >
                  <div 
                    className={`h-4 bg-gray-300 rounded ${
                      column.alignment === 'center' ? 'mx-auto w-16' :
                      column.alignment === 'right' ? 'ml-auto w-16' :
                      'w-20'
                    }`}
                  />
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Table Body */}
          <tbody className="divide-y divide-gray-200">
            {[...Array(rows)].map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-200">
                {columns.map((column, colIndex) => (
                  <td 
                    key={colIndex} 
                    className="py-4 px-4"
                    style={{ width: column.width }}
                  >
                    {column.hasAvatar && colIndex === 0 ? (
                      // First column with avatar
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full" />
                        <div className="h-4 bg-gray-300 rounded w-24" />
                      </div>
                    ) : (
                      // Regular column
                      <div 
                        className={`h-4 bg-gray-300 rounded ${
                          column.alignment === 'center' ? 'mx-auto w-16' :
                          column.alignment === 'right' ? 'ml-auto w-16' :
                          'w-20'
                        }`}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
