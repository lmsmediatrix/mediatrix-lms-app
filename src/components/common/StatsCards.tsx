import { ReactNode } from "react";

interface StatItem {
  title: string;
  value: string | number;
  change: string;
  icon: ReactNode;
  bgColor: string;
  textColor: string;
  iconBgColor: string;
  iconTextColor: string;
}

interface StatsCardsProps {
  stats: StatItem[];
  isLoading?: boolean;
}

// Skeleton component for stats cards
const StatsSkeleton = () => {
  return (
    <>
      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className="animate-pulse relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_35px_-22px_rgba(15,23,42,0.45)] sm:p-5"
        >
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 bg-slate-200 rounded-xl mr-2" />
            <div className="h-4 bg-slate-200 rounded w-24" />
          </div>
          <div className="h-8 bg-slate-200 rounded w-16 mb-1" />
          <div className="h-5 bg-slate-200 rounded w-32" />
        </div>
      ))}
    </>
  );
};

export default function StatsCards({
  stats,
  isLoading = false,
}: StatsCardsProps) {
  if (isLoading) {
    return <StatsSkeleton />;
  }

  return (
    <>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_35px_-22px_rgba(15,23,42,0.45)] transition-all sm:p-5 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-22px_rgba(15,23,42,0.55)]"
        >
          <div className="relative z-10 mb-1">
            <h3 className="text-sm font-medium">{stat.title}</h3>
          </div>
          <p className="relative z-10 text-2xl font-bold mb-1">{stat.value}</p>
          <p className="relative z-10 text-xs text-gray-500">{stat.change}</p>
        </div>
      ))}
    </>
  );
}
