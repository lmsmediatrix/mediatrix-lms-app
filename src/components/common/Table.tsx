interface Column {
  key: string;
  header: string;
  width?: string;
  hideOnMobile?: boolean; // New prop to control column visibility
}

interface TableProps {
  columns: Column[];
  children: React.ReactNode;
  scrollable?: boolean;
  maxHeight?: string;
}

export default function Table({
  columns,
  children,
  scrollable = false,
  maxHeight = "500px",
}: TableProps) {
  if (scrollable) {
    return (
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full border-collapse min-w-[950px]">
          <colgroup>
            {columns.map((column, index) => (
              <col
                key={index}
                style={{ width: column.width }}
                className={column.hideOnMobile ? "hidden md:table-column" : ""}
              />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-gray-200 bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent_95%)]">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`text-left p-4 text-gray-500 font-bold ${
                    column.hideOnMobile ? "hidden md:table-cell" : ""
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="overflow-auto border-t-0" style={{ maxHeight }}>
          <table className="w-full border-collapse min-w-[950px]">
            <colgroup>
              {columns.map((column, index) => (
                <col
                  key={index}
                  style={{ width: column.width }}
                  className={
                    column.hideOnMobile ? "hidden md:table-column" : ""
                  }
                />
              ))}
            </colgroup>
            <tbody className="divide-y divide-gray-200 bg-white">
              {children}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full border-collapse min-w-[950px]">
        <thead>
          <tr className="border-b border-gray-200 bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent_95%)]">
            {columns.map((column, index) => (
              <th
                key={index}
                className={`text-left p-4 text-gray-500 font-bold ${
                  column.hideOnMobile ? "hidden md:table-cell" : ""
                }`}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">{children}</tbody>
      </table>
    </div>
  );
}
