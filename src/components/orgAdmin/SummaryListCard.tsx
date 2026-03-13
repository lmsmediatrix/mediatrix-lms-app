import Button from "../common/Button";

interface SummaryListCardProps {
  title: string;
  items: { label: string; value: string | number; valueLabel?: string }[];
  buttonText?: string;
  onButtonClick?: () => void;
}

export default function SummaryListCard({
  title,
  items,
  buttonText,
  onButtonClick,
}: SummaryListCardProps) {
  return (
    <div className="bg-white border rounded-xl p-4 flex flex-col">
      <h2 className="font-bold text-xl mb-4">{title}</h2>
      <div className="flex-1 space-y-3 mb-4">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <div
              key={item.label + idx}
              className="flex items-center justify-between"
            >
              <span className="line-clamp-1">{item.label}</span>
              <span className="bg-secondary text-white text-sm font-medium rounded-full px-4 py-1 min-w-[80px] text-center">
                {item.value} {item.valueLabel ? item.valueLabel : ""}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500">No data available</div>
        )}
      </div>
      {buttonText && (
        <Button
          variant="outline"
          className="mt-2 border rounded-lg w-full py-2 text-base font-medium hover:bg-gray-50 transition"
          onClick={onButtonClick}
        >
          {buttonText}
        </Button>
      )}
    </div>
  );
}
