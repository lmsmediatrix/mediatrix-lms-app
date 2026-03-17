import { useEffect, useRef, useState } from "react";
import { ImSpinner2 } from "react-icons/im";
import { BookOpenIcon } from "@/components/ui/book-open-icon";
import { UsersIcon } from "@/components/ui/users-icon";
import { ChartBarIcon } from "@/components/ui/chart-bar-icon";
import { InfoIcon } from "@/components/ui/info-icon";

interface AnimIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

const iconMap = {
  courses: BookOpenIcon,
  students: UsersIcon,
  assignments: ChartBarIcon,
  critical: InfoIcon,
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

interface StatCardProps {
  value: number | string;
  label: string;
  icon: IconType;
  loading?: boolean;
  onClick?: () => void;
  variant?: StatCardVariant;
  size?: "sm" | "md";
}

export default function StatCard({
  value,
  label,
  icon,
  loading = false,
  onClick,
  variant = "glass",
  size = "md",
}: StatCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const iconRef = useRef<AnimIconHandle>(null);

  useEffect(() => {
    if (isHovered) iconRef.current?.startAnimation();
    else iconRef.current?.stopAnimation();
  }, [isHovered]);

  const Icon = iconMap[icon];
  const IconWithRef = Icon as React.ForwardRefExoticComponent<
    { size?: number } & React.RefAttributes<AnimIconHandle>
  >;

  const styles = variantStyles[variant];
  const sizeStyles = {
    md: {
      container: "min-w-[140px] lg:min-w-[180px] p-3.5 rounded-xl",
      value: "text-2xl",
      label: "text-xs",
      iconWrap: "p-2 rounded-lg",
      iconSize: 18,
      spinnerWrap: "h-7",
      spinner: "text-xl",
    },
    sm: {
      container: "min-w-[120px] lg:min-w-[150px] p-2.5 rounded-lg",
      value: "text-xl",
      label: "text-[11px]",
      iconWrap: "p-1.5 rounded-md",
      iconSize: 14,
      spinnerWrap: "h-6",
      spinner: "text-lg",
    },
  } as const;
  const sizeClass = sizeStyles[size];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
          <IconWithRef ref={iconRef} size={sizeClass.iconSize} />
        </div>
      </div>
    </div>
  );
}
