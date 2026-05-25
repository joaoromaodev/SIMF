"use server";

/**
 * Server actions para gestão administrativa de usuários (AUTH-05).
 *
 * Todas as funções verificam que o chamador tem role `admin` antes de agir.
 * A service role key é usada apenas server-side para operações de admin da Auth.
 */

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "../../lib/supabase/server.js";
import { getSessionRole } from "../../lib/auth/require-role.js";

const VALID_ROLES = ["admin", "user"];

/** Garante que o chamador é admin; lança erro caso contrário. */
async function assertCallerIsAdmin() {
  const session = await getSessionRole();
  if (!session || session.role !== "admin") {
    throw new Error("Acesso negado. Apenas administradores podem executar esta ação.");
  }
  return session;
}

/**
 * Lista todos os usuários com seus perfis.
 *
 * @returns {{ users: Array<{ id, email, role, created_at }>, error: string|null }}
 */
export async function listUsers() {
  try {
    await assertCallerIsAdmin();

    const adminSb = getSupabaseAdminClient();

    // Busca todos os perfis (cada perfil corresponde a um usuário Auth)
    const { data: profiles, error } = await adminSb
      .from("profiles")
      .select("id, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return { users: [], error: `Erro ao listar usuários: ${error.message}` };
    }

    return { users: profiles ?? [], error: null };
  } catch (err) {
    return { users: [], error: err.message };
  }
}

/**
 * Cria um novo usuário no Supabase Auth e insere o perfil com role.
 *
 * Em caso de erro parcial (Auth criado, profile falhou) o usuário Auth
 * é removido para manter consistência.
 *
 * @param {{ email: string, password: string, role: "admin"|"user" }} params
 * @returns {{ ok: boolean, error: string|null }}
 */
export async function createUser({ email, password, role }) {
  try {
    await assertCallerIsAdmin();

    if (!email || !password) {
      return { ok: false, error: "E-mail e senha são obrigatórios." };
    }
    if (!VALID_ROLES.includes(role)) {
      return { ok: false, error: "Role inválido. Use 'admin' ou 'user'." };
    }
    if (password.length < 8) {
      return { ok: false, error: "A senha deve ter pelo menos 8 caracteres." };
    }

    const adminSb = getSupabaseAdminClient();

    // 1. Cria usuário na Auth do Supabase
    const { data: authData, error: authError } = await adminSb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,  // confirma o e-mail automaticamente
    });

    if (authError) {
      return { ok: false, error: `Erro ao criar usuário: ${authError.message}` };
    }

    const userId = authData.user.id;

    // 2. Upsert do perfil com role definido pelo admin
    //    (o trigger handle_new_user pode já ter inserido 'user'; upsert corrige o role)
    const { error: profileError } = await adminSb
      .from("profiles")
      .upsert({ id: userId, email, role }, { onConflict: "id" });

    if (profileError) {
      // Erro parcial: reverte criação na Auth para manter consistência
      await adminSb.auth.admin.deleteUser(userId).catch(() => {});
      return {
        ok: false,
        error: `Usuário Auth criado mas perfil falhou — revertido. Detalhe: ${profileError.message}`,
      };
    }

    revalidatePath("/dashboard/admin/usuarios");
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Atualiza o role de um usuário existente.
 *
 * Um usuário não pode alterar o próprio role.
 *
 * @param {{ userId: string, role: "admin"|"user" }} params
 * @returns {{ ok: boolean, error: string|null }}
 */
export async function updateUserRole({ userId, role }) {
  try {
    const caller = await assertCallerIsAdmin();

    if (!userId) {
      return { ok: false, error: "userId é obrigatório." };
    }
    if (!VALID_ROLES.includes(role)) {
      return { ok: false, error: "Role inválido. Use 'admin' ou 'user'." };
    }

    // Impede que o admin altere o próprio role
    if (caller.id === userId) {
      return { ok: false, error: "Você não pode alterar o próprio role." };
    }

    const adminSb = getSupabaseAdminClient();
    const { error } = await adminSb
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      return { ok: false, error: `Erro ao atualizar role: ${error.message}` };
    }

    revalidatePath("/dashboard/admin/usuarios");
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Remove um usuário do Supabase Auth (o perfil é removido em cascata via FK).
 *
 * Um usuário não pode se remover.
 *
 * @param {{ userId: string }} params
 * @returns {{ ok: boolean, error: string|null }}
 */
export async function deleteUser({ userId }) {
  try {
    const caller = await assertCallerIsAdmin();

    if (!userId) {
      return { ok: false, error: "userId é obrigatório." };
    }
    if (caller.id === userId) {
      return { ok: false, error: "Você não pode remover o próprio usuário." };
    }

    const adminSb = getSupabaseAdminClient();
    const { error } = await adminSb.auth.admin.deleteUser(userId);

    if (error) {
      return { ok: false, error: `Erro ao remover usuário: ${error.message}` };
    }

    revalidatePath("/dashboard/admin/usuarios");
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
