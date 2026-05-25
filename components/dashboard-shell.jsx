"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck2,
  CreditCard,
  Database,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BookOpen,
  Calculator,
  LogOut,
  User,
} from "lucide-react";
import { logout } from "../app/actions/auth.js";

const NAV_SECTIONS = [
  {
    label: "Diretoria de Finanças",
    abbr: "DFIN",
    items: [
      { label: "CEO",   href: "/dashboard/dfin/ceo",  icon: TrendingUp  },
      { label: "CPED",  href: "/dashboard/dfin/cped", icon: BookOpen    },
      { label: "ACONT", href: "/dashboard/dfin/acont",icon: Calculator  },
    ],
  },
  {
    label: "Pagamento e Prestação de Contas",
    abbr: "DPPC",
    items: [
      { label: "CLIQ", href: "/dashboard/dppc/cliq", icon: FileCheck2 },
      { label: "CPAG", href: "/dashboard/dppc/cpag", icon: CreditCard  },
    ],
  },
];

function userInitials(email) {
  if (!email) return "US";
  const parts = email.split("@")[0].split(".");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

/**
 * Shell do dashboard — layout visual completo.
 *
 * @param {{ userEmail: string, userRole: "admin"|"user"|null, children: React.ReactNode }} props
 */
export default function DashboardShell({ userEmail, userRole, children }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted,   setIsMounted  ] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      const stored = localStorage.getItem("sidebarCollapsed");
      if (stored !== null) setIsCollapsed(stored === "true");
      hasInitialized.current = true;
      setIsMounted(true);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("sidebarCollapsed", isCollapsed.toString());
    }
  }, [isCollapsed, isMounted]);

  const isAdmin = userRole === "admin";

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside
        className={`${
          isCollapsed ? "w-[72px]" : "w-64"
        } bg-white border-r border-slate-200 text-slate-700 flex flex-col shadow-sm transition-all duration-300 ease-in-out flex-shrink-0`}
      >
        {/* Logo */}
        <div className={`flex items-center border-b border-slate-100 transition-all duration-300 ${isCollapsed ? "px-4 py-5 justify-center" : "px-6 py-5 justify-between"}`}>
          {!isCollapsed && (
            <Link href="/" className="hover:opacity-75 transition-opacity cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <LayoutDashboard size={14} className="text-white" />
                </div>
                <span className="text-base font-black tracking-tight text-slate-900">SIMF</span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-medium pl-9">
                SEDUC · Pará
              </p>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-6 scrollbar-none">
          {NAV_SECTIONS.map((section) => (
            <div key={section.abbr}>
              {!isCollapsed && (
                <p className="px-6 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {section.abbr}
                </p>
              )}
              <ul className="space-y-0.5 px-3">
                {section.items.map(({ label, href, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        title={isCollapsed ? label : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                          active
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        <Icon size={17} className="flex-shrink-0" />
                        {!isCollapsed && <span>{label}</span>}
                        {!isCollapsed && active && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Rodapé — "Atualizar Base" visível apenas para admin */}
        <div className={`border-t border-slate-100 transition-all duration-300 ${isCollapsed ? "px-3 py-4" : "px-4 py-4"} space-y-1`}>
          {isAdmin && (
            <Link
              href="/dashboard/import"
              title={isCollapsed ? "Atualizar Base" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-150 ${
                pathname === "/dashboard/import"
                  ? "bg-red-500 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white"
              }`}
            >
              <Database size={17} className="flex-shrink-0" />
              {!isCollapsed && <span>Atualizar Base</span>}
            </Link>
          )}
        </div>
      </aside>

      {/* ── Conteúdo ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Secretaria Adjunta de Planejamento e Finanças
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              SAPF
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Badge de role */}
            {isAdmin && (
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5">
                Admin
              </span>
            )}
            {/* Avatar + email */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                <span className="text-[10px] font-black text-slate-500">
                  {userInitials(userEmail)}
                </span>
              </div>
              {userEmail && (
                <span className="text-xs font-medium text-slate-500 hidden sm:block max-w-[160px] truncate">
                  {userEmail}
                </span>
              )}
            </div>
            {/* Logout */}
            <form action={logout}>
              <button
                type="submit"
                title="Sair"
                className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
