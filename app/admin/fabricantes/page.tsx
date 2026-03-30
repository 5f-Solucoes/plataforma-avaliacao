import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/MainLayout";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FabricantesManager } from "@/components/admin/FabricantesManager";

// Função para buscar todos os fabricantes, ordenados por nome
async function getFabricantes() {
  return await prisma.fabricante.findMany({
    orderBy: { nome: 'asc' }
  });
}

// Página de gerenciamento de fabricantes, acessível apenas para usuários com permissão ADMIN ou INSTRUCTOR
export default async function FabricantesPage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
    redirect("/dashboard");
  }

  const fabricantes = await getFabricantes();

  return (
    // @ts-ignore
    <MainLayout user={user}>
      <FabricantesManager fabricantes={fabricantes} />
    </MainLayout>
  );
}