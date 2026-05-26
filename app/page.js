import { redirect } from "next/navigation";
import { getSessionRole } from "../lib/auth/require-role.js";

/**
 * Página raiz — redireciona para login ou dashboard conforme sessão.
 *
 * Sem sessão  →  /login
 * Com sessão  →  /dashboard/dppc
 */
export default async function HomePage() {
  const session = await getSessionRole();

  if (session) {
    redirect("/dashboard/dppc");
  } else {
    redirect("/login");
  }
}
