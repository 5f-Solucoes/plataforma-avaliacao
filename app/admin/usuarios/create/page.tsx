import { MainLayout } from "@/components/MainLayout";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserForm } from "@/components/admin/UserForm";

export const metadata = { title: "Criar Usuário" };

// Página de criação de usuário, acessível apenas para usuários com permissão ADMIN, permitindo a adição de novos usuários ao sistema
export default async function CreateUserPage() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "ADMIN") {
      redirect("/dashboard");
  }

  return (
    // @ts-ignore
    <MainLayout user={user}>
      <UserForm />
    </MainLayout>
  );
}