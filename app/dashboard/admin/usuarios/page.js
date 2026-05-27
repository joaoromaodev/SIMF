import { requireAdmin } from "../../../../lib/auth/require-role.js";
import { listUsers } from "../../../actions/admin.js";
import UserManagementClient from "../../../../components/user-management-client.jsx";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  // Apenas admin pode acessar esta página
  const { user: currentUser } = await requireAdmin();

  const { users, error } = await listUsers();

  return (
    <UserManagementClient
      users={users}
      currentUserId={currentUser.id}
      fetchError={error}
    />
  );
}
