import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

interface AnimIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface DashboardStatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number }>;
  index?: number;
  onClick?: () => void;
}

const CARD_THEMES = [
  {
    colorVar: "--color-primary",
    fallback: "#3b82f6",
  },
  {
    colorVar: "--color-secondary",
    fallback: "#8b5cf6",
  },
  {
    colorVar: "--color-success",
    fallback: "#10b981",
  },
  {
    colorVar: "--color-accent",
    fallback: "#f59e0b",
  },
];

export default function DashboardStatCard({
  label,
  value,
  icon: Icon,
  index = 0,
  onClick,
}: DashboardStatCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const iconRef = useRef<AnimIconHandle>(null);

  useEffect(() => {
    if (isHovered) iconRef.current?.startAnimation();
    else iconRef.current?.stopAnimation();
  }, [isHovered]);

  const IconWithRef = Icon as React.ForwardRefExoticComponent<
    { size?: number } & React.RefAttributes<AnimIconHandle>
  >;

  const t = CARD_THEMES[index % CARD_THEMES.length];
  const color = `var(${t.colorVar}, ${t.fallback})`;
  const colorDark = `color-mix(in srgb, ${color} 78%, #0f172a 22%)`;
  const colorLight = `color-mix(in srgb, ${color} 6%, white 94%)`;
  const colorMid = `color-mix(in srgb, ${color} 16%, white 84%)`;
  const colorBadge = `color-mix(in srgb, ${color} 16%, white 84%)`;

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="rounded-2xl border cursor-pointer select-none p-5 transition-all"
      style={{
        backgroundColor: colorLight,
        borderColor: colorMid,
        boxShadow: `0 1px 2px color-mix(in srgb, ${color} 10%, transparent 90%)`,
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Top row: label + icon badge */}
        <div className="flex items-start justify-between gap-3">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: `color-mix(in srgb, ${color} 70%, #374151 30%)` }}
          >
            {label}
          </span>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm"
            style={{
              backgroundColor: colorBadge,
              color,
              border: `1px solid ${colorMid}`,
            }}
          >
            <IconWithRef ref={iconRef} size={22} />
          </div>
        </div>

        {/* Value */}
        <div className="flex items-end justify-between">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 * (index ?? 0) }}
            className="text-4xl font-extrabold leading-none tracking-tight"
            style={{ color: colorDark }}
          >
            {value.toLocaleString()}
          </motion.span>
          <div
            className="mb-1 h-1.5 w-10 rounded-full opacity-60"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>
    </motion.div>
  );
}
