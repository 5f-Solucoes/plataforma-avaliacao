import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MainLayout } from "@/components/MainLayout";
import { Title } from "@mantine/core";
import { ProvasList } from "@/components/Dashboard/ProvasList"; 
import { redirect } from "next/navigation";

async function getData(userId: number) {
  const [rawProvas, certificadosValidos] = await Promise.all([
    prisma.prova.findMany({
      include: { fabricante: true },
      where: { validadeMeses: { gt: 0 } }
    }),
    prisma.certificado.findMany({
      where: {
        usuarioId: userId,
        dataValidade: { gt: new Date() } 
      },
      include: {
        tentativa: {
          select: { provaId: true }
        }
      }
    })
  ]);

  const provas = rawProvas.map((prova) => ({
    ...prova,
    notaCorte: prova.notaCorte.toNumber(),
  }));

  const provasConcluidasIds = new Set(certificadosValidos.map(c => c.tentativa.provaId));

  return { provas, provasConcluidasIds };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { provas, provasConcluidasIds } = await getData(user.id);

  return (
    // @ts-ignore
    <MainLayout user={user}>
      <Title order={2} mb="xl">Provas Disponíveis</Title>
      <ProvasList provas={provas} concluidasIds={Array.from(provasConcluidasIds)} />
    </MainLayout>
  );
}