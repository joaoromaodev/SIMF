"use server";

/**
 * Server actions para gestão administrativa de usuários.
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
 * Registra uma entrada no audit_log via service role (sem RLS).
 * Falha silenciosa — auditoria não deve bloquear a operação principal.
 */
async function writeAuditLog(adminSb, { action, actorId, targetId, payload = {} }) {
  try {
    await adminSb.from("audit_log").insert({
      action,
      actor_id:  actorId  ?? null,
      target_id: targetId ?? null,
      payload,
    });
  } catch {
    // Nunca interrompe o fluxo principal
  }
}

/**
 * Lista todos os usuários com seus perfis.
 */
export async function listUsers() {
  try {
    await assertCallerIsAdmin();

    const adminSb = getSupabaseAdminClient();
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
 */
export async function createUser({ email, password, role }) {
  try {
    const caller = await assertCallerIsAdmin();

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

    const { data: authData, error: authError } = await adminSb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return { ok: false, error: `Erro ao criar usuário: ${authError.message}` };
    }

    const userId = authData.user.id;

    const { error: profileError } = await adminSb
      .from("profiles")
      .upsert({ id: userId, email, role }, { onConflict: "id" });

    if (profileError) {
      await adminSb.auth.admin.deleteUser(userId).catch(() => {});
      return {
        ok: false,
        error: `Usuário Auth criado mas perfil falhou — revertido. Detalhe: ${profileError.message}`,
      };
    }

    await writeAuditLog(adminSb, {
      action:   "user_created",
      actorId:  caller.id,
      targetId: userId,
      payload:  { email, role },
    });

    revalidatePath("/dashboard/admin/usuarios");
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Atualiza o role de um usuário existente.
 * Um usuário não pode alterar o próprio role.
 */
export async function updateUserRole({ userId, role }) {
  try {
    const caller = await assertCallerIsAdmin();

    if (!userId) return { ok: false, error: "userId é obrigatório." };
    if (!VALID_ROLES.includes(role)) return { ok: false, error: "Role inválido. Use 'admin' ou 'user'." };
    if (caller.id === userId) return { ok: false, error: "Você não pode alterar o próprio role." };

    const adminSb = getSupabaseAdminClient();

    // Lê role anterior antes de atualizar (para auditoria)
    const { data: oldProfile } = await adminSb
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    const { error } = await adminSb
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) return { ok: false, error: `Erro ao atualizar role: ${error.message}` };

    await writeAuditLog(adminSb, {
      action:   "role_changed",
      actorId:  caller.id,
      targetId: userId,
      payload:  { previous_role: oldProfile?.role ?? null, new_role: role },
    });

    revalidatePath("/dashboard/admin/usuarios");
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Atualiza o e-mail de um usuário.
 * Atualiza tanto no Supabase Auth quanto em profiles.email.
 * O e-mail é confirmado automaticamente (sem exigir verificação).
 */
export async function updateUserEmail({ userId, email }) {
  try {
    await assertCallerIsAdmin();

    if (!userId) return { ok: false, error: "userId é obrigatório." };
    if (!email)  return { ok: false, error: "E-mail é obrigatório." };

    const adminSb = getSupabaseAdminClient();

    const { error: authError } = await adminSb.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
    });

    if (authError) return { ok: false, error: `Erro ao atualizar e-mail: ${authError.message}` };

    const { error: profileError } = await adminSb
      .from("profiles")
      .update({ email, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (profileError) {
      return { ok: false, error: `E-mail atualizado na Auth mas falhou em profiles: ${profileError.message}` };
    }

    revalidatePath("/dashboard/admin/usuarios");
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Redefine a senha de um usuário (admin define nova senha diretamente).
 */
export async function resetUserPassword({ userId, password }) {
  try {
    await assertCallerIsAdmin();

    if (!userId)   return { ok: false, error: "userId é obrigatório." };
    if (!password) return { ok: false, error: "Senha é obrigatória." };
    if (password.length < 8) return { ok: false, error: "A senha deve ter pelo menos 8 caracteres." };

    const adminSb = getSupabaseAdminClient();
    const { error } = await adminSb.auth.admin.updateUserById(userId, { password });

    if (error) return { ok: false, error: `Erro ao redefinir senha: ${error.message}` };

    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Remove um usuário do Supabase Auth (o perfil é removido em cascata via FK).
 * Um usuário não pode se remover.
 */
export async function deleteUser({ userId }) {
  try {
    const caller = await assertCallerIsAdmin();

    if (!userId) return { ok: false, error: "userId é obrigatório." };
    if (caller.id === userId) return { ok: false, error: "Você não pode remover o próprio usuário." };

    const adminSb = getSupabaseAdminClient();

    // Lê email e role antes de remover (para auditoria)
    const { data: targetProfile } = await adminSb
      .from("profiles")
      .select("email, role")
      .eq("id", userId)
      .maybeSingle();

    const { error } = await adminSb.auth.admin.deleteUser(userId);

    if (error) return { ok: false, error: `Erro ao remover usuário: ${error.message}` };

    await writeAuditLog(adminSb, {
      action:   "user_deleted",
      actorId:  caller.id,
      targetId: null,
      payload:  {
        deleted_user_id: userId,
        email: targetProfile?.email ?? null,
        role:  targetProfile?.role  ?? null,
      },
    });

    revalidatePath("/dashboard/admin/usuarios");
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
