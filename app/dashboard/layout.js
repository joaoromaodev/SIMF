/**
 * Layout do dashboard — Server Component.
 *
 * Responsabilidades:
 *  - Lê a sessão e o role do usuário via createSupabaseSessionClient.
 *  - Passa userEmail e userRole para o DashboardShell (Client Component).
 *  - NÃO faz redirect aqui (o middleware já garante autenticação).
 */

import DashboardShell from "../../components/dashboard-shell.jsx";
import { getSessionRole } from "../../lib/auth/require-role.js";

export default async function DashboardLayout({ children }) {
  const session = await getSessionRole();

  return (
    <DashboardShell
      userEmail={session?.email ?? ""}
      userRole={session?.role ?? null}
    >
      {children}
    </DashboardShell>
  );
}
