/**
 * StatCard — card de KPI padronizado para CEO, CLIQ, CPAG e ACONT.
 *
 * Props:
 *  label   string          — rótulo em caixa alta (ex: "Empenhos Gerados")
 *  value   string|number   — valor principal já formatado (ex: "1.060" ou "R$ 63.7M")
 *  sub     string?         — linha secundária opcional (ex: "22 páginas · 50 por página")
 *  icon    LucideIcon      — ícone Lucide
 *  accent  "blue"|"green"|"amber"  — cor semântica (default: "blue")
 */

const ACCENT = {
  blue:  { icon: "text-para-blue",    bg: "bg-para-blue-light"  },
  green: { icon: "text-emerald-600",  bg: "bg-emerald-50"       },
  amber: { icon: "text-amber-600",    bg: "bg-amber-50"         },
};

export default function StatCard({ label, value, sub, icon: Icon, accent = "blue", className = "" }) {
  const { icon: iconColor, bg: iconBg } = ACCENT[accent] ?? ACCENT.blue;

  return (
    <div
      className={`bg-white rounded-card border border-slate-200 px-5 py-4 flex items-center gap-3.5 ${className}`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={16} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5 leading-none">
          {label}
        </p>
        <p className="text-xl font-black text-slate-900 leading-tight tracking-tight tabular-nums">
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-snug">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
