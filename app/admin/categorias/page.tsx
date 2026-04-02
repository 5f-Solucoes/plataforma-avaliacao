import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/MainLayout";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CategoriasManager } from "@/components/admin/CategoriasManager";

export const metadata = { title: "Gerenciar Categorias" };

async function getCategoriasAgrupadas() {
  const categorias = await prisma.prova.groupBy({
    by: ['categoria'],
    _count: {
      id: true, 
    },
    where: {
      categoria: {
        not: null, 
      }
    },
    orderBy: {
      categoria: 'asc'
    }
  });

  return categorias.filter(c => c.categoria && c.categoria.trim() !== "");
}

// Página de gerenciamento de categorias, acessível apenas para usuários com permissão ADMIN ou INSTRUCTOR
export default async function CategoriasPage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
    redirect("/dashboard");
  }

  const categorias = await getCategoriasAgrupadas();

  return (
    // @ts-ignore
    <MainLayout user={user}>
      <CategoriasManager categorias={categorias as any} />
    </MainLayout>
  );
}