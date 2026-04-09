"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import "../globals.css";

export default function DashboardLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      const stored = localStorage.getItem("sidebarCollapsed");
      if (stored !== null) {
        setIsCollapsed(stored === "true");
      }
      hasInitialized.current = true;
      setIsMounted(true);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("sidebarCollapsed", isCollapsed.toString());
    }
  }, [isCollapsed, isMounted]);

  return (
    <div className="flex h-screen bg-para-white font-sans text-slate-800">
      {/* Sidebar Institucional - Azul Pará */}
      <aside
        className={`${
          isCollapsed ? "w-20" : "w-64"
        } bg-para-blue text-white flex flex-col shadow-xl transition-all duration-300 ease-in-out`}
      >
        {/* Header com Toggle Button */}
        <div className={`${isCollapsed ? "px-3 py-4" : "p-8"} border-b border-blue-400/30 flex items-center justify-between transition-all duration-300`}>
          <div className={isCollapsed ? "hidden" : "block"}>
            <h1 className="text-2xl font-bold tracking-tight">SIMF</h1>
            <p className="text-xs text-blue-200 font-medium uppercase tracking-widest">
              Governo do Estado do Pará
            </p>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Toggle sidebar"
            className="p-2 hover:bg-white/10 rounded transition-colors cursor-pointer flex-shrink-0"
          >
            {isCollapsed ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto transition-all duration-300">
          <div className={isCollapsed ? "hidden" : "block p-6 space-y-8"}>
            {/* Módulo DFIN */}
            <div>
              <h2 className="text-sm font-black text-blue-100/50 uppercase mb-4 tracking-wider">
                Diretoria de Finanças (DFIN)
              </h2>
              <ul className="space-y-2 text-sm">
                <li className="p-3 hover:bg-white/10 rounded-md cursor-pointer transition-colors">CEO</li>
                <li className="p-3 hover:bg-white/10 rounded-md cursor-pointer transition-colors">CPED</li>
                <li className="p-3 hover:bg-white/10 rounded-md cursor-pointer transition-colors">ACONT</li>
              </ul>
            </div>

            {/* Módulo DPPC */}
            <div>
              <h2 className="text-sm font-black text-blue-100/50 uppercase mb-4 tracking-wider">
                Pagamento e Prestação de Contas (DPPC)
              </h2>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/dashboard/dppc/cliq"
                    className="block p-3 hover:bg-white/10 rounded-md transition-colors"
                  >
                    CLIQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/dppc/cpag"
                    className="block p-3 hover:bg-white/10 rounded-md transition-colors"
                  >
                    CPAG
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Rodapé de Gestão */}
        <div className={`${isCollapsed ? "px-3 py-4" : "p-6"} bg-blue-900/20 transition-all duration-300`}>
          <a
            href="/dashboard/import"
            className="flex items-center justify-center gap-2 p-3 bg-para-red hover:bg-red-700 text-white rounded-lg font-bold shadow-lg transition-all"
            title={isCollapsed ? "Atualizar Base" : ""}
          >
            <svg 
  width="20" 
  height="20" 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="currentColor" 
  strokeWidth="2" 
  strokeLinecap="round" 
  strokeLinejoin="round" 
  className="flex-shrink-0"
>
  <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
</svg>
            <span className={isCollapsed ? "hidden" : "block"}>Atualizar Base</span>
          </a>
        </div>
      </aside>

      {/* Área de Conteúdo */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center shadow-sm">
          <span className="text-slate-400 font-medium">SECRETARIA ADJUNTA DE PLANEJAMENTO E FINANÇAS (SAPF)</span>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-500">Usuário do Sistema</p>
          </div>
        </header>
        <section className="p-10">
          {children}
        </section>
      </main>
    </div>
  );
}