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
    cardBg: "bg-blue-50",
    border: "border-blue-100",
    iconBg: "bg-blue-500",
  },
  {
    cardBg: "bg-indigo-50",
    border: "border-indigo-100",
    iconBg: "bg-indigo-500",
  },
  {
    cardBg: "bg-emerald-50",
    border: "border-emerald-100",
    iconBg: "bg-emerald-500",
  },
  {
    cardBg: "bg-slate-50",
    border: "border-slate-200",
    iconBg: "bg-indigo-950",
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
  const helperText = "Current total records";

  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`rounded-lg border cursor-pointer select-none p-4 transition-all ${t.cardBg} ${t.border}`}
    >
      <div className="flex flex-col gap-1">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-white ${t.iconBg}`}
          >
            <IconWithRef ref={iconRef} size={20} />
          </span>
          <h3 className="text-sm font-medium text-slate-800">{`Total ${label}`}</h3>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 * (index ?? 0) }}
          className="mb-1 text-2xl font-bold tabular-nums text-slate-900"
        >
          {value.toLocaleString()}
        </motion.p>

        <p className="text-xs text-gray-500">{helperText}</p>
      </div>
    </motion.div>
  );
}
