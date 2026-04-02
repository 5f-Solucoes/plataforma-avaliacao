import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MainLayout } from "@/components/MainLayout";
import { redirect, notFound } from "next/navigation";
import { QuestoesManager } from "@/components/admin/QuestoesManager";

export const metadata = { title: "Questões da Prova" };

interface PageProps {
  params: Promise<{ id: string }>;
}

// Página de gerenciamento de questões para uma prova específica, acessível apenas para usuários com permissão ADMIN ou INSTRUCTOR
export default async function AdminQuestoesPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const provaId = parseInt(id);

  if (isNaN(provaId)) {
      notFound();
  }

  const prova = await prisma.prova.findUnique({
    where: { id: provaId },
    include: {
      perguntas: {
        include: { respostas: true },
        orderBy: { id: 'asc' }
      }
    }
  });

  if (!prova) {
    notFound();
  }

  return (
    // @ts-ignore
    <MainLayout user={user}>
      <QuestoesManager 
        provaId={prova.id} 
        provaNome={prova.nome} 
        questoes={prova.perguntas} 
      />
    </MainLayout>
  );
}