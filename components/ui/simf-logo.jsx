// components/ui/simf-logo.jsx
// SIMF — Logo institucional.
//
// variant="icon" — apenas o glifo, 28×28 (sidebar recolhida).
// variant="full" — glifo + wordmark "SIMF" + sublinha "SEDUC · Pará".
//
// tone="dark"  — para fundos claros (slate-900 + slate-400). Default.
// tone="light" — para fundos coloridos/escuros (white + white/60).

import React from "react";

function LogoMark({ size = 28, tone = "dark", className = "" }) {
  // Para tone="dark", quadrado azul institucional com barras brancas.
  // Para tone="light" (usado em sidebar azul), quadrado branco com barras azuis.
  const square = tone === "light" ? "#ffffff" : "#0071CE";
  const bar    = tone === "light" ? "#0071CE" : "#ffffff";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="SIMF"
      className={className}
    >
      <rect width="28" height="28" rx="7" fill={square} />
      <rect x="6"     y="17" width="3.5" height="5"  rx="1" fill={bar} fillOpacity="0.55" />
      <rect x="12.25" y="13" width="3.5" height="9"  rx="1" fill={bar} fillOpacity="0.8" />
      <rect x="18.5"  y="8"  width="3.5" height="14" rx="1" fill={bar} />
    </svg>
  );
}

export default function SimfLogo({ variant = "full", tone = "dark", className = "" }) {
  if (variant === "icon") {
    return <LogoMark tone={tone} className={className} />;
  }

  const wordmarkColor = tone === "light" ? "text-white"      : "text-slate-900";
  const sublineColor  = tone === "light" ? "text-white/60"   : "text-slate-400";

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark tone={tone} />
      <div className="flex flex-col leading-none">
        <span className={`font-black text-xl tracking-tight ${wordmarkColor}`}>
          SIMF
        </span>
        <span className={`mt-1 text-[10px] uppercase tracking-widest ${sublineColor}`}>
          SEDUC · Pará
        </span>
      </div>
    </div>
  );
}
