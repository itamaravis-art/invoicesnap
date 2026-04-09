import { MaterialIcon } from "@/components/shared/MaterialIcon";

interface KpiCardProps {
  icon: string;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
  color?: "blue" | "green" | "amber" | "red" | "purple";
}

const colorMap = {
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  green: "bg-emerald-50 text-emerald-600 border-emerald-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  red: "bg-red-50 text-red-600 border-red-100",
  purple: "bg-purple-50 text-purple-600 border-purple-100",
};

const iconBgMap = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
  red: "bg-red-100 text-red-600",
  purple: "bg-purple-100 text-purple-600",
};

export function KpiCard({ icon, label, value, subtitle, trend, color = "blue" }: KpiCardProps) {
  return (
    <div className={`rounded-2xl border p-5 ${colorMap[color]} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgMap[color]}`}>
          <MaterialIcon icon={icon} size={20} />
        </div>
        {trend && (
          <span className={`text-xs font-bold flex items-center gap-0.5 ${
            trend.positive ? "text-emerald-600" : "text-red-600"
          }`}>
            <MaterialIcon icon={trend.positive ? "trending_up" : "trending_down"} size={14} />
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black tracking-tight">{value}</p>
      <p className="text-sm font-medium opacity-70 mt-0.5">{label}</p>
      {subtitle && <p className="text-xs opacity-50 mt-1">{subtitle}</p>}
    </div>
  );
}
