import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/MainLayout";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { QuestoesBank } from "@/components/admin/QuestoesBank";

async function getQuestoes() {
  const questoes = await prisma.pergunta.findMany({
    include: {
      provas : { 
        select: {
            id: true,
            nome: true,
            fabricante: { select: { nome: true } }
        }
      },
      respostas: true
    },
    orderBy: {
        id: 'desc' 
    }
  });

  return questoes;
}

async function getProvasDisponiveis() {
  return await prisma.prova.findMany({
    select: {
      id: true,
      nome: true,
    },
    orderBy: {
      nome: 'asc'
    }
  });
}

export default async function BancoQuestoesPage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
    redirect("/dashboard");
  }

  const questoes = await getQuestoes();
  const provasDisponiveis = await getProvasDisponiveis();

  return (
    // @ts-ignore
    <MainLayout user={user}>
      <QuestoesBank 
        questoes={questoes} 
        provasDisponiveis={provasDisponiveis} 
      />
    </MainLayout>
  );
}