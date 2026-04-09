import { MaterialIcon } from "@/components/shared/MaterialIcon";

interface Activity {
  id: string;
  type: "receipt" | "user" | "export" | "ocr";
  description: string;
  time: string;
  user_email?: string;
}

const typeIcons: Record<string, { icon: string; color: string }> = {
  receipt: { icon: "receipt_long", color: "bg-blue-100 text-blue-600" },
  user: { icon: "person_add", color: "bg-emerald-100 text-emerald-600" },
  export: { icon: "send", color: "bg-purple-100 text-purple-600" },
  ocr: { icon: "document_scanner", color: "bg-amber-100 text-amber-600" },
};

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <MaterialIcon icon="notifications_active" size={18} className="text-slate-400" />
        {"\u05e4\u05e2\u05d9\u05dc\u05d5\u05ea \u05d0\u05d7\u05e8\u05d5\u05e0\u05d4"}
      </h3>
      <div className="space-y-3">
        {activities.map((activity) => {
          const typeInfo = typeIcons[activity.type] || typeIcons.receipt;
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeInfo.color}`}>
                <MaterialIcon icon={typeInfo.icon} size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">{activity.description}</p>
                <div className="flex gap-2 mt-0.5">
                  {activity.user_email && (
                    <span className="text-xs text-slate-400" dir="ltr">{activity.user_email}</span>
                  )}
                  <span className="text-xs text-slate-400">{activity.time}</span>
                </div>
              </div>
            </div>
          );
        })}
        {activities.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">{"\u05d0\u05d9\u05df \u05e4\u05e2\u05d9\u05dc\u05d5\u05ea \u05d0\u05d7\u05e8\u05d5\u05e0\u05d4"}</p>
        )}
      </div>
    </div>
  );
}
