interface DashboardStatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconColor: string;
  onClick?: () => void;
}

export default function DashboardStatCard({
  label,
  value,
  icon,
  iconColor,
  onClick
}: DashboardStatCardProps) {
  return (
    <div onClick={() => onClick} className="flex flex-col justify-between h-32 p-6 rounded-lg border bg-white">
      <div className="flex items-start justify-between">
        <span className="text-lg font-medium text-gray-800">{label}</span>
        <span className="rounded-full p-2" style={{ color: iconColor }}>
          {icon}
        </span>
      </div>
      <span className="text-3xl font-bold text-gray-900">{value}</span>
    </div>
  );
}
