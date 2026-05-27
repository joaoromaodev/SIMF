"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileCheck2,
  CreditCard,
  Database,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Calculator,
  LogOut,
  Users,
} from "lucide-react";
import { logout } from "../app/actions/auth.js";
import SimfLogo from "./ui/simf-logo.jsx";

const NAV_SECTIONS = [
  {
    label: "Diretoria de Finanças",
    abbr: "DFIN",
    items: [
      { label: "CEO",   href: "/dashboard/dfin/ceo", icon: TrendingUp  },
      { label: "ACONT", href: "/dashboard/acont",    icon: Calculator  },
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
 * Item de navegação da sidebar.
 * Mostra barra branca de 3px à esquerda quando ativo.
 */
function NavItem({ href, label, icon: Icon, active, collapsed }) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
        collapsed ? "px-3 py-2.5 justify-center" : "px-3 py-2.5"
      } ${
        active
          ? "bg-white/15 text-white"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      {/* Barra ativa de 3px à esquerda */}
      <span
        aria-hidden="true"
        className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-white transition-opacity ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
      <Icon size={17} className="flex-shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
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
        } bg-para-blue text-white flex flex-col transition-all duration-300 ease-in-out flex-shrink-0`}
      >
        {/* Logo + toggle */}
        <div
          className={`flex items-center border-b border-white/10 transition-all duration-300 ${
            isCollapsed ? "px-3 py-5 justify-center" : "px-5 py-5 justify-between"
          }`}
        >
          {!isCollapsed ? (
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <SimfLogo variant="full" tone="light" />
            </Link>
          ) : (
            <Link href="/" className="hover:opacity-90 transition-opacity" aria-label="SIMF">
              <SimfLogo variant="icon" tone="light" />
            </Link>
          )}
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="Recolher sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Botão expandir (modo recolhido) */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="mx-3 mt-3 p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
            aria-label="Expandir sidebar"
          >
            <ChevronRight size={16} />
          </button>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-5 space-y-6 scrollbar-none">
          {NAV_SECTIONS.map((section) => (
            <div key={section.abbr}>
              {!isCollapsed && (
                <p className="px-5 mb-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                  {section.abbr}
                </p>
              )}
              <ul className="space-y-0.5 px-3">
                {section.items.map(({ label, href, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <li key={href}>
                      <NavItem
                        href={href}
                        label={label}
                        icon={Icon}
                        active={active}
                        collapsed={isCollapsed}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Admin section (visível só para admins) */}
          {isAdmin && (
            <div>
              {!isCollapsed && (
                <p className="px-5 mb-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                  Administração
                </p>
              )}
              <ul className="space-y-0.5 px-3">
                <li>
                  <NavItem
                    href="/dashboard/admin/usuarios"
                    label="Usuários"
                    icon={Users}
                    active={pathname === "/dashboard/admin/usuarios"}
                    collapsed={isCollapsed}
                  />
                </li>
                <li>
                  <NavItem
                    href="/dashboard/import"
                    label="Atualizar Base"
                    icon={Database}
                    active={pathname === "/dashboard/import"}
                    collapsed={isCollapsed}
                  />
                </li>
              </ul>
            </div>
          )}
        </nav>

        {/* Rodapé — usuário + logout */}
        <div className="border-t border-white/10 p-3">
          <div
            className={`flex items-center gap-3 rounded-lg bg-white/5 ${
              isCollapsed ? "p-2 justify-center" : "p-2.5"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-black text-white tracking-wider">
                {userInitials(userEmail)}
              </span>
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-white truncate" title={userEmail || ""}>
                    {userEmail || "—"}
                  </p>
                  {isAdmin && (
                    <p className="text-[10px] uppercase tracking-widest text-white/50 font-medium">
                      Administrador
                    </p>
                  )}
                </div>
                <form action={logout}>
                  <button
                    type="submit"
                    title="Sair"
                    className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/15 transition-colors"
                  >
                    <LogOut size={15} />
                  </button>
                </form>
              </>
            )}
          </div>
          {/* Logout dedicado quando recolhido */}
          {isCollapsed && (
            <form action={logout} className="mt-2 flex justify-center">
              <button
                type="submit"
                title="Sair"
                className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/15 transition-colors"
              >
                <LogOut size={15} />
              </button>
            </form>
          )}
        </div>
      </aside>

      {/* ── Conteúdo ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-baseline gap-3">
            <span className="text-sm font-black text-slate-900 tracking-tight">
              SAPF
            </span>
            <span className="text-[11px] font-medium uppercase tracking-widest text-slate-400 hidden md:inline">
              Secretaria Adjunta de Planejamento e Finanças
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <span className="text-[10px] font-black uppercase tracking-widest text-para-blue bg-para-blue-light border border-para-blue/20 rounded-full px-2.5 py-0.5">
                Admin
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
