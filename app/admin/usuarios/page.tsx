import { MainLayout } from "@/components/MainLayout";
import { getCurrentUser } from "@/lib/auth";
import { Title } from "@mantine/core";
import { redirect } from "next/navigation";
import { getUsersAction } from "@/app/admin/usuarios/actions";
import { UsersManager } from "@/components/admin/UsersManager";

// Página de gerenciamento de usuários, acessível apenas para usuários com permissão ADMIN, permitindo a visualização, criação, edição e exclusão de usuários do sistema
export default async function AdminUsuariosPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await getUsersAction();

  return (
    // @ts-ignore
    <MainLayout user={currentUser}>
      <Title order={2} mb="xl">Gerenciar Usuários</Title>
      
      <UsersManager users={users} currentUserId={currentUser.id} />
      
    </MainLayout>
  );
}