"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface TrendData {
  month: string;
  amount: number;
  label: string;
}

export function ExpenseTrend({ data }: { data: TrendData[] }) {
  if (data.length === 0) return null;

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-4 card-hover">
      <h3 className="font-bold text-on-surface text-sm mb-3">מגמת הוצאות (12 חודשים)</h3>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#666" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              formatter={(value) => [`₪${Number(value).toLocaleString()}`, "הוצאות"]}
              labelFormatter={(label) => label}
              contentStyle={{ direction: "rtl", borderRadius: 12, fontSize: 12 }}
            />
            <Bar
              dataKey="amount"
              fill="var(--md-sys-color-primary, #0040a1)"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
