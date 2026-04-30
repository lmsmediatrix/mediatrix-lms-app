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
    iconBg: "bg-blue-500",
  },
  {
    iconBg: "bg-indigo-500",
  },
  {
    iconBg: "bg-emerald-500",
  },
  {
    iconBg: "bg-slate-700",
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
      className="cursor-pointer select-none rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_35px_-22px_rgba(15,23,42,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-22px_rgba(15,23,42,0.55)]"
    >
      <div className="flex flex-col gap-1">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-white shadow-sm ${t.iconBg}`}
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
