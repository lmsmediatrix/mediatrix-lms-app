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
    darkFallback: "#1d4ed8",
    lightFallback: "#eff6ff",
    midFallback: "#bfdbfe",
  },
  {
    colorVar: "--color-secondary",
    fallback: "#8b5cf6",
    darkFallback: "#6d28d9",
    lightFallback: "#f5f3ff",
    midFallback: "#ddd6fe",
  },
  {
    colorVar: "--color-success",
    fallback: "#10b981",
    darkFallback: "#065f46",
    lightFallback: "#ecfdf5",
    midFallback: "#a7f3d0",
  },
  {
    colorVar: "--color-accent",
    fallback: "#f59e0b",
    darkFallback: "#b45309",
    lightFallback: "#fffbeb",
    midFallback: "#fde68a",
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
  const colorDark = `var(${t.colorVar}-dark, color-mix(in srgb, ${color} 80%, black 20%))`;
  const colorLight = `color-mix(in srgb, ${color} 10%, white 90%)`;
  const colorMid = `color-mix(in srgb, ${color} 22%, white 78%)`;
  const colorBadge = `color-mix(in srgb, ${color} 16%, white 84%)`;

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative overflow-hidden rounded-2xl border cursor-pointer select-none"
      style={{
        background: `linear-gradient(145deg, ${colorLight} 0%, white 55%, ${colorLight} 100%)`,
        borderColor: colorMid,
        boxShadow: `0 1px 3px color-mix(in srgb, ${color} 10%, transparent 90%), 0 0 0 1px ${colorMid}`,
      }}
    >
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-15"
        style={{ backgroundColor: color }}
      />
      <div
        className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full opacity-10"
        style={{ backgroundColor: color }}
      />
      <div
        className="pointer-events-none absolute -bottom-4 -left-4 h-14 w-14 rounded-full opacity-8"
        style={{ backgroundColor: color }}
      />

      <div className="relative z-10 flex flex-col gap-4 p-5">
        {/* Top row: label + icon badge */}
        <div className="flex items-start justify-between gap-3">
          <span
            className="text-xs font-bold uppercase tracking-widest"
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
