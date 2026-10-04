"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#005eb8", "#0a1628", "#3d8fd1", "#7aa7c9", "#c45c26", "#1b7f4e"];

export function ProductionChart({ data }: { data: { family: string; productionQty: number; goodQty: number; fpy: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d5deea" />
        <XAxis dataKey="family" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" domain={[90, 100]} />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="productionQty" name="Production Qty" fill="#0a1628" />
        <Bar yAxisId="left" dataKey="goodQty" name="Good Qty" fill="#005eb8" />
        <Line yAxisId="right" type="monotone" dataKey="fpy" name="FPY %" stroke="#c45c26" strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, total }: { data: { name: string; value: number }[]; total: number }) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-semibold text-navy">{total}</p>
          <p className="text-[11px] uppercase text-muted">Total NCR</p>
        </div>
      </div>
    </div>
  );
}

export function TrendChart({ data }: { data: { month: string; ncr: number; complaints: number; supplierNcr: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d5deea" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="ncr" name="NCR" stroke="#005eb8" strokeWidth={2} />
        <Line type="monotone" dataKey="complaints" name="Customer Complaints" stroke="#c45c26" strokeWidth={2} />
        <Line type="monotone" dataKey="supplierNcr" name="Supplier NCR" stroke="#1b7f4e" strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBars({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d5deea" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" width={90} />
        <Tooltip />
        <Bar dataKey="value" fill="#005eb8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
