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
          className="animate-pulse p-4 rounded-lg bg-gray-100 border border-gray-300"
        >
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 bg-gray-300 rounded-lg mr-2" />
            <div className="h-4 bg-gray-300 rounded w-24" />
          </div>
          <div className="h-8 bg-gray-300 rounded w-16 mb-1" />
          <div className="h-5 bg-gray-300 rounded w-32" />
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
          className={`p-4 rounded-lg ${stat.bgColor} border border-gray-300`}
        >
          <div className="flex items-center mb-1">
            <span
              className={`flex items-center justify-center size-8 rounded-lg ${stat.iconBgColor} ${stat.iconTextColor} mr-2`}
            >
              {stat.icon}
            </span>
            <h3 className="text-sm font-medium">{stat.title}</h3>
          </div>
          <p className="text-2xl font-bold mb-1">{stat.value}</p>
          <p className="text-xs text-gray-500">{stat.change}</p>
        </div>
      ))}
    </>
  );
}
