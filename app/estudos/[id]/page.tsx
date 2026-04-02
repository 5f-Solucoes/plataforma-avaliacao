import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/MainLayout";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EstudosViewer } from "@/components/Estudos/EstudosViewer";

export const metadata = { title: "Material de Estudo" };

interface PageProps {
  params: Promise<{ id: string }>;
}

// Página de detalhes do estudo para uma prova específica
export default async function EstudoDetalhePage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const provaId = parseInt(id);

  const prova = await prisma.prova.findUnique({
    where: { id: provaId },
    include: {
      materiais: { orderBy: { id: 'asc' } },
      fabricante: true
    }
  });

  if (!prova) redirect("/estudos");

  return (
    // @ts-ignore
    <MainLayout user={user}>
      <EstudosViewer prova={prova} userRole={user.role} />
    </MainLayout>
  );
}