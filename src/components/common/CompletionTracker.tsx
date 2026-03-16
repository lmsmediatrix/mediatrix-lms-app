type CompletionItem = {
  label: string;
  value: number;
  total: number;
  helper?: string;
  onClick?: () => void;
};

// Opacity levels for each successive card so they feel distinct but unified
const BAR_OPACITIES = [1, 0.7, 0.5];
const CARD_OPACITIES = [0.08, 0.05, 0.04];
const BORDER_OPACITIES = [0.25, 0.18, 0.14];

export default function CompletionTracker({
  title = "Completion Tracker",
  items,
  className,
}: {
  title?: string;
  items: CompletionItem[];
  className?: string;
}) {
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

          const barOpacity = BAR_OPACITIES[idx % BAR_OPACITIES.length];
          const cardOpacity = CARD_OPACITIES[idx % CARD_OPACITIES.length];
          const borderOpacity = BORDER_OPACITIES[idx % BORDER_OPACITIES.length];

          const cardStyle: React.CSSProperties = {
            backgroundColor: `color-mix(in srgb, var(--color-primary, #3b82f6) ${Math.round(cardOpacity * 100)}%, white ${Math.round((1 - cardOpacity) * 100)}%)`,
            borderColor: `color-mix(in srgb, var(--color-primary, #3b82f6) ${Math.round(borderOpacity * 100)}%, white ${Math.round((1 - borderOpacity) * 100)}%)`,
          };

          const barStyle: React.CSSProperties = {
            width: `${percent}%`,
            backgroundColor: `color-mix(in srgb, var(--color-primary, #3b82f6) ${Math.round(barOpacity * 100)}%, transparent 0%)`,
          };

          const cardContent = (
            <>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-400">/ {total}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
              <div className="mt-3 h-1.5 rounded-full bg-white/60 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={barStyle}
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
              className="rounded-xl border p-4 text-left transition-all duration-200 hover:shadow-sm hover:brightness-95 focus:outline-none"
              style={cardStyle}
            >
              {cardContent}
            </button>
          ) : (
            <div
              key={`${item.label}-${idx}`}
              className="rounded-xl border p-4"
              style={cardStyle}
            >
              {cardContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
