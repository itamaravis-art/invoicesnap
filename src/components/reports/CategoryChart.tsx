"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

interface CategoryData {
  name: string;
  amount: number;
  color: string;
}

export function CategoryChart({ data }: { data: CategoryData[] }) {
  if (data.length === 0) return null;

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-4">
      <h3 className="font-bold text-on-surface text-sm mb-3">פילוח לפי קטגוריה</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={3}
              dataKey="amount"
              nameKey="name"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Legend
              formatter={(value) => <span className="text-xs text-on-surface-variant">{value}</span>}
              iconSize={8}
              wrapperStyle={{ direction: "rtl" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
