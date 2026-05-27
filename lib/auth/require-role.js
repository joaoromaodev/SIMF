/**
 * Helpers server-side para verificação de autenticação e role.
 *
 * Uso em Server Components e Server Actions:
 *
 *   import { requireAdmin, getSessionRole } from "@/lib/auth/require-role.js";
 *
 *   // Bloqueia acesso se não for admin (redireciona):
 *   const { user, role } = await requireAdmin();
 *
 *   // Apenas lê role, sem redirecionar:
 *   const session = await getSessionRole();
 *   if (session?.role !== "admin") { ... }
 */

import { createSupabaseSessionClient } from "../supabase/session.js";
import { redirect } from "next/navigation";

/**
 * Garante que o usuário autenticado tem role `admin`.
 * Redireciona para /login se não houver sessão.
 * Redireciona para /dashboard/dppc?erro=acesso-negado se role !== admin.
 *
 * @returns {{ user: object, role: string }}
 */
export async function requireAdmin() {
  const supabase = await createSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // Usuário autenticado sem perfil ou com role desconhecido → bloqueia
  if (!profile || !["admin", "user"].includes(profile.role)) {
    redirect("/login?erro=perfil-nao-encontrado");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard/dppc?erro=acesso-negado");
  }

  return { user, role: profile.role };
}

/**
 * Retorna dados do usuário autenticado e seu role.
 * Retorna null se não houver sessão válida.
 *
 * @returns {{ id: string, email: string, role: string|null }|null}
 */
export async function getSessionRole() {
  try {
    const supabase = await createSupabaseSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    return {
      id:    user.id,
      email: user.email ?? "",
      role:  profile?.role ?? null,
    };
  } catch {
    return null;
  }
}
