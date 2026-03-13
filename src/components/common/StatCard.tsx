import {
  FaBookOpen,
  FaUserGraduate,
  FaClipboardList,
  FaExclamationTriangle,
} from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";

interface StatCardProps {
  value: number | string;
  label: string;
  icon: IconType;
  loading?: boolean;
  onClick?: () => void;
  variant?: StatCardVariant;
  size?: "sm" | "md";
}

const iconMap = {
  courses: FaBookOpen,
  students: FaUserGraduate,
  assignments: FaClipboardList,
  critical: FaExclamationTriangle,
} as const;

const iconColors = {
  glass: {
    courses: "bg-blue-400/25 text-blue-100",
    students: "bg-purple-400/25 text-purple-100",
    assignments: "bg-amber-400/25 text-amber-100",
    critical: "bg-rose-400/25 text-rose-200",
  },
  solid: {
    courses: "bg-blue-100 text-blue-600",
    students: "bg-purple-100 text-purple-600",
    assignments: "bg-amber-100 text-amber-600",
    critical: "bg-rose-100 text-rose-600",
  },
} as const;

const variantStyles = {
  glass: {
    container:
      "bg-white/10 backdrop-blur-sm border border-white/20 text-white shadow-lg",
    label: "text-white/70",
    hover: "hover:bg-white/20",
  },
  solid: {
    container: "bg-white border border-gray-200 text-gray-900 shadow-sm",
    label: "text-gray-500",
    hover: "hover:bg-gray-50",
  },
} as const;

export type IconType = keyof typeof iconMap;
export type StatCardVariant = keyof typeof iconColors;

export default function StatCard({
  value,
  label,
  icon,
  loading = false,
  onClick,
  variant = "glass",
  size = "md",
}: StatCardProps) {
  const Icon = iconMap[icon];
  const styles = variantStyles[variant];
  const sizeStyles = {
    md: {
      container: "min-w-[140px] lg:min-w-[180px] p-3.5 rounded-xl",
      value: "text-2xl",
      label: "text-xs",
      iconWrap: "p-2 rounded-lg",
      icon: "text-base",
      spinnerWrap: "h-7",
      spinner: "text-xl",
    },
    sm: {
      container: "min-w-[120px] lg:min-w-[150px] p-2.5 rounded-lg",
      value: "text-xl",
      label: "text-[11px]",
      iconWrap: "p-1.5 rounded-md",
      icon: "text-sm",
      spinnerWrap: "h-6",
      spinner: "text-lg",
    },
  } as const;
  const sizeClass = sizeStyles[size];

  return (
    <div
      onClick={onClick}
      className={`${sizeClass.container} ${styles.container} ${
        onClick
          ? `cursor-pointer ${styles.hover} transition-all duration-200`
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          {loading ? (
            <div className={`${sizeClass.spinnerWrap} flex items-center`}>
              <ImSpinner2
                className={`animate-spin ${sizeClass.spinner} opacity-70`}
              />
            </div>
          ) : (
            <p
              className={`${sizeClass.value} font-bold tracking-tight leading-none`}
            >
              {value}
            </p>
          )}
          <p className={`${sizeClass.label} font-medium ${styles.label}`}>
            {label}
          </p>
        </div>
        <div className={`${sizeClass.iconWrap} ${iconColors[variant][icon]}`}>
          <Icon className={sizeClass.icon} />
        </div>
      </div>
    </div>
  );
}
