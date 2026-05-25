"use client";

import { useState, useTransition } from "react";
import { createUser, updateUserRole, deleteUser } from "../app/actions/admin.js";
import { Users, UserPlus, Shield, User, Trash2, RefreshCw, X, Check, AlertCircle } from "lucide-react";

function formatDate(ts) {
  if (!ts) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Belem",
  }).format(new Date(ts));
}

function RoleBadge({ role }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5">
        <Shield size={9} />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-0.5">
      <User size={9} />
      Usuário
    </span>
  );
}

function Alert({ type, message, onClose }) {
  const styles = {
    error: "bg-red-50 border-red-200 text-red-700",
    success: "bg-green-50 border-green-200 text-green-700",
  };
  const Icon = type === "error" ? AlertCircle : Check;
  return (
    <div className={`flex items-start gap-3 border rounded-lg px-4 py-3 text-sm ${styles[type]}`}>
      <Icon size={15} className="flex-shrink-0 mt-0.5" />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0 opacity-60 hover:opacity-100">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// ── Formulário de criação de usuário ─────────────────────────────────────────

function CreateUserForm({ onSuccess }) {
  const [pending, startTransition] = useTransition();
  const [alert, setAlert] = useState(null);
  const [form, setForm] = useState({ email: "", password: "", role: "user" });

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setAlert(null);
    startTransition(async () => {
      const result = await createUser(form);
      if (result.ok) {
        setAlert({ type: "success", message: "Usuário criado com sucesso." });
        setForm({ email: "", password: "", role: "user" });
        onSuccess?.();
      } else {
        setAlert({ type: "error", message: result.error });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {alert && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
            E-mail
          </label>
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="usuario@seduc.pa.gov.br"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
            Senha inicial
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={handleChange}
            placeholder="Mínimo 8 caracteres"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      <div className="flex items-end gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
            Perfil de acesso
          </label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="user">Usuário — acesso aos dashboards</option>
            <option value="admin">Admin — acesso total + importação</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <UserPlus size={14} />
          )}
          {pending ? "Criando..." : "Criar usuário"}
        </button>
      </div>

      <p className="text-xs text-slate-400">
        O e-mail é confirmado automaticamente. O usuário pode alterar a senha após o primeiro acesso.
      </p>
    </form>
  );
}

// ── Linha da tabela de usuários ───────────────────────────────────────────────

function UserRow({ user, currentUserId, onRoleChange, onDelete }) {
  const [pending, startTransition] = useTransition();
  const [alert, setAlert] = useState(null);
  const isSelf = user.id === currentUserId;

  function handleRoleChange(e) {
    const newRole = e.target.value;
    startTransition(async () => {
      const result = await updateUserRole({ userId: user.id, role: newRole });
      if (!result.ok) {
        setAlert(result.error);
        setTimeout(() => setAlert(null), 4000);
      } else {
        onRoleChange?.();
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Remover o usuário ${user.email}? Esta ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      const result = await deleteUser({ userId: user.id });
      if (!result.ok) {
        setAlert(result.error);
        setTimeout(() => setAlert(null), 4000);
      } else {
        onDelete?.();
      }
    });
  }

  return (
    <>
      <tr className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${pending ? "opacity-50" : ""}`}>
        <td className="px-4 py-3 text-sm font-medium text-slate-800 max-w-[240px] truncate">
          {user.email}
          {isSelf && (
            <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              (você)
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          {isSelf ? (
            <RoleBadge role={user.role} />
          ) : (
            <select
              value={user.role}
              onChange={handleRoleChange}
              disabled={pending}
              className="text-xs px-2 py-1 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
            >
              <option value="user">Usuário</option>
              <option value="admin">Admin</option>
            </select>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-slate-400">{formatDate(user.created_at)}</td>
        <td className="px-4 py-3 text-right">
          {!isSelf && (
            <button
              onClick={handleDelete}
              disabled={pending}
              title="Remover usuário"
              className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </td>
      </tr>
      {alert && (
        <tr>
          <td colSpan={4} className="px-4 pb-3">
            <Alert type="error" message={alert} onClose={() => setAlert(null)} />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function UserManagementClient({ users: initialUsers, currentUserId, fetchError }) {
  const [users, setUsers] = useState(initialUsers);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Após criar/alterar, recarrega a lista via router.refresh()
  // Como a página é force-dynamic e o Server Action chama revalidatePath,
  // o próximo render do Server Component trará os dados atualizados.
  // Para simplicidade, recarregamos a janela apenas quando necessário.
  function refresh() {
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Users size={16} className="text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Gestão de Usuários
            </h1>
          </div>
          <p className="text-sm text-slate-500 ml-11">
            Crie e gerencie os usuários do sistema. Apenas administradores têm acesso.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            showCreateForm
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {showCreateForm ? <X size={14} /> : <UserPlus size={14} />}
          {showCreateForm ? "Cancelar" : "Novo usuário"}
        </button>
      </div>

      {/* Formulário de criação */}
      {showCreateForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">
            Criar novo usuário
          </h2>
          <CreateUserForm
            onSuccess={() => {
              setShowCreateForm(false);
              refresh();
            }}
          />
        </div>
      )}

      {/* Erro de carregamento */}
      {fetchError && (
        <Alert type="error" message={fetchError} />
      )}

      {/* Tabela de usuários */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">
            Usuários cadastrados
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {users.length} {users.length === 1 ? "usuário" : "usuários"}
          </span>
        </div>

        {users.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum usuário cadastrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                    E-mail
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Perfil
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Criado em
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    currentUserId={currentUserId}
                    onRoleChange={refresh}
                    onDelete={refresh}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Aviso de segurança */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
        <Shield size={13} className="flex-shrink-0 mt-0.5" />
        <span>
          As operações desta página são executadas com privilégios de serviço e registradas no log de auditoria do Supabase.
          Role e senha não podem ser alterados pelo próprio usuário.
        </span>
      </div>
    </div>
  );
}
