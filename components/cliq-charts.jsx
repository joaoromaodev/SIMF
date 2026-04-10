"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#0066cc", "#334155", "#94a3b8", "#cbd5e1", "#e2e8f0", "#f1f5f9"];

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function CustomBarTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-3 rounded shadow-lg border border-slate-200">
        <p className="text-xs font-bold text-slate-800">{data.payload.name}</p>
        <p className="text-sm font-black text-para-blue">{data.value}</p>
      </div>
    );
  }
  return null;
}

function CustomDonutTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    const value = data.value;
    const total = data.payload._total || 0;
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;

    return (
      <div className="bg-white p-3 rounded shadow-lg border border-slate-200">
        <p className="text-xs font-bold text-slate-800">{data.name}</p>
        <p className="text-sm font-black text-para-blue">{formatCurrency(value)}</p>
        <p className="text-xs text-slate-500">{percentage}%</p>
      </div>
    );
  }
  return null;
}

export default function CliqCharts({ statusData = [], sourceData = [] }) {
  const sourceDataWithTotal = sourceData.map((item) => ({
    ...item,
    _total: sourceData.reduce((sum, d) => sum + d.value, 0),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Bar Chart - Status dos Empenhos */}
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        <h3 className="text-lg font-black uppercase tracking-wider text-slate-800 mb-6">
          Status dos Empenhos
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "#334155", fontSize: 12 }}
              axisLine={{ stroke: "#cbd5e1" }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fill: "#334155", fontSize: 12 }}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <Tooltip content={<CustomBarTooltip />} />
            <Bar
              dataKey="value"
              fill="#0066cc"
              radius={[8, 8, 0, 0]}
              isAnimationActive={true}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Donut Chart - Distribuição por Fonte */}
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        <h3 className="text-lg font-black uppercase tracking-wider text-slate-800 mb-6">
          Distribuição por Fonte de Recurso
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={sourceDataWithTotal}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              innerRadius={50}
              fill="#0071ce"
              dataKey="value"
            >
              {sourceDataWithTotal.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomDonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}