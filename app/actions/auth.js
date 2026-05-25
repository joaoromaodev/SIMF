"use server";

import { createSupabaseSessionClient } from "../../lib/supabase/session.js";
import { redirect } from "next/navigation";

/**
 * Encerra a sessão do usuário e redireciona para /login.
 */
export async function logout() {
  const supabase = await createSupabaseSessionClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Retorna o usuário autenticado e seu perfil (role).
 * Retorna null se não houver sessão.
 */
export async function getSessionUser() {
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
    email: user.email,
    role:  profile?.role ?? null,
  };
}
