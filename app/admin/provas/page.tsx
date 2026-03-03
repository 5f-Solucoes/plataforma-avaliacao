import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/MainLayout";
import { getCurrentUser } from "@/lib/auth";
import { Title } from "@mantine/core";
import { redirect } from "next/navigation";
import { ProvasManager } from "@/components/admin/ProvasManager";

// Esta página carrega a LISTA, por isso usa findMany e NÃO recebe params
async function getData() {
  const [rawProvas, fabricantes] = await Promise.all([
    prisma.prova.findMany({
      include: { fabricante: true },
      orderBy: { id: 'desc' }
    }),
    prisma.fabricante.findMany({
        orderBy: { nome: 'asc' }
    })
  ]);

  const provas = rawProvas.map(p => ({
    ...p,
    notaCorte: p.notaCorte.toNumber(),
    validadeMeses: p.validadeMeses ?? 0,
    fabricanteId: p.fabricanteId ?? 0,
  }));

  return { provas, fabricantes };
}

export default async function AdminProvasPage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
    redirect("/dashboard");
  }

  const { provas, fabricantes } = await getData();

  return (
    // @ts-ignore
    <MainLayout user={user}>
      <Title order={2} mb="xl">Gerenciar Provas</Title>
      <ProvasManager provas={provas} fabricantes={fabricantes} />
    </MainLayout>
  );
}