import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/MainLayout";
import { getCurrentUser } from "@/lib/auth";
import { Title } from "@mantine/core";
import { redirect } from "next/navigation";
import { ProvasManager } from "@/components/admin/ProvasManager";

async function getData() {
  const [rawProvas, fabricantes, rawUsuarios] = await Promise.all([
    prisma.prova.findMany({
      include: { 
        fabricante: true,
        usuariosPermitidos: { select: { id: true } },
        materiais: true 
      },
      orderBy: { id: 'desc' }
    }),
    prisma.fabricante.findMany({
        orderBy: { nome: 'asc' }
    }),
    prisma.usuario.findMany({
        select: { id: true, nome: true, email: true },
        orderBy: { nome: 'asc' }
    })
  ]);

  const provas = rawProvas.map(p => ({
    ...p,
    notaCorte: Number(p.notaCorte),
    validadeMeses: p.validadeMeses ?? 0,
    fabricanteId: p.fabricanteId ?? 0,
  }));

  const usuarios = rawUsuarios.map(u => ({
    id: u.id,
    nome: u.nome,
    email: u.email || "Sem e-mail"
  }));

  return { provas, fabricantes, usuarios };
}

export default async function AdminProvasPage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
    redirect("/dashboard");
  }

  const { provas, fabricantes, usuarios } = await getData();
  const cleanUser = JSON.parse(JSON.stringify(user));

  return (
    // @ts-ignore
    <MainLayout user={cleanUser}>
      <Title order={2} mb="xl">Gerenciar Provas</Title>
      <ProvasManager 
        provas={provas} 
        fabricantes={fabricantes} 
        usuarios={usuarios} 
      />
    </MainLayout>
  );
}