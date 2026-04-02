import { MainLayout } from "@/components/MainLayout";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { UserForm } from "@/components/admin/UserForm";

export const metadata = { title: "Editar Usuário" };

interface PageProps {
    params: Promise<{ id: string }>;
}

// Página de edição de usuário, acessível apenas para usuários com permissão ADMIN, permitindo a atualização dos detalhes do usuário selecionado
export default async function EditUserPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  
  const usuarioParaEditar = await prisma.usuario.findUnique({
    where: { id: parseInt(id) }
  });

  if (!usuarioParaEditar) notFound();

  const initialData = {
    id: usuarioParaEditar.id,
    nome: usuarioParaEditar.nome,
    username: usuarioParaEditar.username,
    email: usuarioParaEditar.email || "", 
    role: usuarioParaEditar.role,
    ativo: usuarioParaEditar.ativo
  };

  return (
    // @ts-ignore
    <MainLayout user={user}>
      <UserForm initialData={initialData} />
    </MainLayout>
  );
}