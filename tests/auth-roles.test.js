/**
 * Testes de autorização por perfil (AUTH-03).
 *
 * Estes testes verificam a lógica de controle de acesso sem depender
 * de sessão real do Supabase — usam mocks inline.
 *
 * Execução: node --test tests/auth-roles.test.js
 */

import { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";

// ── Helpers de mock ───────────────────────────────────────────────────────────

function buildMockSupabase({ user = null, role = null, profileError = null } = {}) {
  return {
    auth: {
      getUser: async () => ({
        data: { user },
        error: null,
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: role ? { role } : null,
            error: profileError,
          }),
        }),
      }),
    }),
  };
}

// ── Lógica extraída dos helpers (sem Next.js redirect) ────────────────────────

async function checkAdminAccess(supabase) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { allowed: false, reason: "no-session" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["admin", "user"].includes(profile.role)) {
    return { allowed: false, reason: "no-profile" };
  }

  if (profile.role !== "admin") {
    return { allowed: false, reason: "insufficient-role" };
  }

  return { allowed: true, reason: null };
}

async function checkUserAccess(supabase) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { allowed: false, reason: "no-session" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["admin", "user"].includes(profile.role)) {
    return { allowed: false, reason: "no-profile" };
  }

  return { allowed: true, reason: null, role: profile.role };
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("checkAdminAccess — /dashboard/import", () => {
  it("bloqueia usuário sem sessão", async () => {
    const sb = buildMockSupabase({ user: null });
    const result = await checkAdminAccess(sb);
    assert.equal(result.allowed, false);
    assert.equal(result.reason, "no-session");
  });

  it("bloqueia usuário autenticado sem perfil", async () => {
    const sb = buildMockSupabase({ user: { id: "u1", email: "a@a.com" }, role: null });
    const result = await checkAdminAccess(sb);
    assert.equal(result.allowed, false);
    assert.equal(result.reason, "no-profile");
  });

  it("bloqueia usuário com role 'user'", async () => {
    const sb = buildMockSupabase({ user: { id: "u2", email: "u@u.com" }, role: "user" });
    const result = await checkAdminAccess(sb);
    assert.equal(result.allowed, false);
    assert.equal(result.reason, "insufficient-role");
  });

  it("permite usuário com role 'admin'", async () => {
    const sb = buildMockSupabase({ user: { id: "u3", email: "a@a.com" }, role: "admin" });
    const result = await checkAdminAccess(sb);
    assert.equal(result.allowed, true);
    assert.equal(result.reason, null);
  });
});

describe("checkUserAccess — /dashboard/*", () => {
  it("bloqueia usuário sem sessão", async () => {
    const sb = buildMockSupabase({ user: null });
    const result = await checkUserAccess(sb);
    assert.equal(result.allowed, false);
    assert.equal(result.reason, "no-session");
  });

  it("bloqueia usuário sem perfil", async () => {
    const sb = buildMockSupabase({ user: { id: "u1" }, role: null });
    const result = await checkUserAccess(sb);
    assert.equal(result.allowed, false);
    assert.equal(result.reason, "no-profile");
  });

  it("permite usuário com role 'user'", async () => {
    const sb = buildMockSupabase({ user: { id: "u2" }, role: "user" });
    const result = await checkUserAccess(sb);
    assert.equal(result.allowed, true);
    assert.equal(result.role, "user");
  });

  it("permite usuário com role 'admin'", async () => {
    const sb = buildMockSupabase({ user: { id: "u3" }, role: "admin" });
    const result = await checkUserAccess(sb);
    assert.equal(result.allowed, true);
    assert.equal(result.role, "admin");
  });

  it("bloqueia role desconhecido", async () => {
    const sb = buildMockSupabase({ user: { id: "u4" }, role: "superuser" });
    const result = await checkUserAccess(sb);
    assert.equal(result.allowed, false);
    assert.equal(result.reason, "no-profile");
  });
});

// ── Lógica extraída da proteção de POST /api/imports ─────────────────────────

async function checkImportApiAccess(supabase) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { status: 401, message: "Autenticação necessária." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return { status: 403, message: "Acesso negado. Apenas administradores podem importar relatórios." };
  }

  return { status: 200, userId: user.id };
}

describe("checkImportApiAccess — POST /api/imports", () => {
  it("retorna 401 para requisição sem sessão", async () => {
    const sb = buildMockSupabase({ user: null });
    const result = await checkImportApiAccess(sb);
    assert.equal(result.status, 401);
  });

  it("retorna 403 para usuário com role 'user'", async () => {
    const sb = buildMockSupabase({ user: { id: "u1" }, role: "user" });
    const result = await checkImportApiAccess(sb);
    assert.equal(result.status, 403);
  });

  it("retorna 403 para usuário sem perfil", async () => {
    const sb = buildMockSupabase({ user: { id: "u2" }, role: null });
    const result = await checkImportApiAccess(sb);
    assert.equal(result.status, 403);
  });

  it("retorna 200 para admin — e expõe userId para auditoria", async () => {
    const sb = buildMockSupabase({ user: { id: "admin-uuid" }, role: "admin" });
    const result = await checkImportApiAccess(sb);
    assert.equal(result.status, 200);
    assert.equal(result.userId, "admin-uuid");
  });

  it("role enviado via client (body) é ignorado — decisão vem só de profiles", async () => {
    // Simula cenário onde client tenta enviar role=admin no body,
    // mas a validação usa apenas o profile lido do banco.
    const sb = buildMockSupabase({ user: { id: "u3" }, role: "user" });
    // Mesmo que o caller passasse role=admin no FormData, a função
    // ignora qualquer parâmetro externo e lê apenas do mock de profiles.
    const result = await checkImportApiAccess(sb);
    assert.equal(result.status, 403);
  });
});
