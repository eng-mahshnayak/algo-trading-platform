// TradeReportChart.tsx

import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

/**
 * Props:
 *  data: { label: string; win: number; loss: number }[]
 *  title?: string
 *
 * Example data item:
 *  { label: "Mon", win: 3, loss: 1 }
 */
type Props = {
  data?: Array<{ label: string; win: number; loss: number }>;
  title?: string;
};

const DEFAULT_DATA = [
  { label: "Mon", win: 3, loss: 1 },
  { label: "Tue", win: 1, loss: 2 },
  { label: "Wed", win: 4, loss: 0 },
  { label: "Thu", win: 2, loss: 3 },
  { label: "Fri", win: 5, loss: 1 },
];

export default function TradeReportChart({ data = DEFAULT_DATA, title = "Trade Report" }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-semibold text-gray-600">{title}</h3>
        <div className="hidden sm:flex items-center gap-6">
          <span className="flex items-center gap-2 text-gray-600">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#6D5DF6" }} />
            Win Trades
          </span>
          <span className="flex items-center gap-2 text-gray-600">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#F4A340" }} />
            Lose Trades
          </span>
        </div>
      </div>

      <div style={{ height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="label" tick={{ fill: "#6b7280" }} />
            <YAxis allowDecimals={false} tick={{ fill: "#6b7280" }} />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
              contentStyle={{ borderRadius: 12, borderColor: "#e5e7eb" }}
            />
            <Legend />
            {/* Colors chosen to match your screenshot legend */}
            <Bar dataKey="win" name="Win Trades" fill="#6D5DF6" radius={[6, 6, 0, 0]} />
            <Bar dataKey="loss" name="Lose Trades" fill="#F4A340" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
