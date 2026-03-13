type CompletionItem = {
  label: string;
  value: number;
  total: number;
  helper?: string;
  onClick?: () => void;
};

export default function CompletionTracker({
  title = "Completion Tracker",
  items,
  className,
}: {
  title?: string;
  items: CompletionItem[];
  className?: string;
}) {
  const colors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500"];

  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className || ""}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {title}
        </h4>
      </div>
      <div
        className={`grid grid-cols-1 ${
          items.length >= 3
            ? "sm:grid-cols-3"
            : items.length === 2
              ? "sm:grid-cols-2"
              : "sm:grid-cols-1"
        } gap-3`}
      >
        {items.map((item, idx) => {
          const total = Number.isFinite(item.total) ? item.total : 0;
          const value = Number.isFinite(item.value) ? item.value : 0;
          const percent = total > 0 ? Math.round((value / total) * 100) : 0;
          const barColor = colors[idx % colors.length];
          const cardContent = (
            <>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-400">/ {total}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
              <div className="mt-3 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full ${barColor}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                {percent}% {item.helper ? `· ${item.helper}` : ""}
              </p>
            </>
          );

          return item.onClick ? (
            <button
              key={`${item.label}-${idx}`}
              type="button"
              onClick={item.onClick}
              className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-left transition hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {cardContent}
            </button>
          ) : (
            <div
              key={`${item.label}-${idx}`}
              className="rounded-xl border border-gray-100 bg-gray-50 p-4"
            >
              {cardContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
