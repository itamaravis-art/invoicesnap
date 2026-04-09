"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface CategoryData {
  name_he: string;
  color: string;
  icon: string;
  amount: number;
  count: number;
}

export function TopCategories({ data }: { data: CategoryData[] }) {
  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-4 card-hover">
      <h3 className="font-bold text-on-surface text-sm mb-3">פילוח הוצאות</h3>
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={40}
                paddingAngle={2}
                dataKey="amount"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5">
          {data.slice(0, 5).map((cat, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-xs text-on-surface">{cat.name_he}</span>
              </div>
              <span className="text-xs font-bold text-on-surface-variant">
                {total > 0 ? Math.round((cat.amount / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
