interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  iconBgColor: string;
  iconTextColor: string;
}

export default function StatsCard({
  title,
  value,
  change,
  icon,
  bgColor,
  iconBgColor,
  iconTextColor,
}: StatCardProps) {
  return (
    <div className={`p-4 rounded-lg ${bgColor} border border-gray-300`}>
      <div className="flex items-center mb-2">
        <span
          className={`flex items-center justify-center w-10 h-10 rounded-lg ${iconBgColor} ${iconTextColor} mr-2`}
        >
          {icon}
        </span>
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-xs text-gray-500">{change}</p>
    </div>
  );
}
