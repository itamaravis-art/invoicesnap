import { MaterialIcon } from "@/components/shared/MaterialIcon";

interface StatusItem {
  name: string;
  status: "healthy" | "warning" | "error";
  value: string;
  icon: string;
}

export function SystemStatus({ items }: { items: StatusItem[] }) {
  const statusColors = {
    healthy: "text-emerald-600 bg-emerald-50",
    warning: "text-amber-600 bg-amber-50",
    error: "text-red-600 bg-red-50",
  };

  const dotColors = {
    healthy: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <MaterialIcon icon="monitor_heart" size={18} className="text-slate-400" />
        {"\u05e1\u05d8\u05d8\u05d5\u05e1 \u05de\u05e2\u05e8\u05db\u05ea"}
      </h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusColors[item.status]}`}>
                <MaterialIcon icon={item.icon} size={16} />
              </div>
              <span className="text-sm font-medium text-slate-700">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{item.value}</span>
              <div className={`w-2 h-2 rounded-full ${dotColors[item.status]}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
