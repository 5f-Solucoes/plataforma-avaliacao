import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MainLayout } from "@/components/MainLayout";
import { Title } from "@mantine/core";
import { ProvasList } from "@/components/Dashboard/ProvasList"; 
import { redirect } from "next/navigation";

// Função para buscar dados necessários para a dashboard
async function getData(userId: number) {
  const certificadosValidos = await prisma.certificado.findMany({
    where: { usuarioId: userId },
    include: { tentativa: true }
  });

  const provasAprovadasIds = certificadosValidos.map(c => c.tentativa.provaId);

  const rawProvas = await prisma.prova.findMany({
    where: { 
      usuariosPermitidos: { some: { id: userId } },
      id: { notIn: provasAprovadasIds }
    },
    include: { fabricante: true },
    orderBy: { nome: 'asc' }
  });

  const provasSanitizadas = rawProvas.map(p => ({
    ...p,
    notaCorte: Number(p.notaCorte)
  }));

  return { 
    provas: provasSanitizadas, 
    provasConcluidasIds: provasAprovadasIds 
  };
}

// Página principal da dashboard
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { provas, provasConcluidasIds } = await getData(user.id);

  return (
    // @ts-ignore
    <MainLayout user={user}>
      <Title order={2} mb="xl">Provas Disponíveis</Title>
      <ProvasList provas={provas} concluidasIds={provasConcluidasIds} />
    </MainLayout>
  );
}