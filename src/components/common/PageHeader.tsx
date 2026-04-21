import { FaArrowLeft } from "react-icons/fa";

interface PageHeaderProps {
  onBack: () => void;
  icon: React.ReactNode;
  iconBg?: string;
  iconStyle?: React.CSSProperties;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function PageHeader({
  onBack,
  icon,
  iconBg = "",
  iconStyle,
  title,
  subtitle,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center h-9 w-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 shadow-sm transition-all shrink-0"
          aria-label="Go back"
        >
          <FaArrowLeft className="text-sm" />
        </button>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${iconBg}`}
          style={iconStyle}
        >
          {icon}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
