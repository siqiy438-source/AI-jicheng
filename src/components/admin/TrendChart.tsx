import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface TrendChartProps {
  data: { date: string; [key: string]: string | number }[];
  dataKey: string;
  label: string;
  color?: string;
  formatter?: (v: number) => string;
}

export const TrendChart = ({ data, dataKey, label, color = "#6366f1", formatter }: TrendChartProps) => (
  <div className="rounded-xl border bg-card p-4">
    <p className="text-sm font-medium mb-3">{label}</p>
    {data.length === 0 ? (
      <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
        暂无数据
      </div>
    ) : (
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40}
            tickFormatter={formatter} />
          <Tooltip
            formatter={(v: number) => [formatter ? formatter(v) : v, label]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    )}
  </div>
);
