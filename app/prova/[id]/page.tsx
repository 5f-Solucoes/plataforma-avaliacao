import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/MainLayout";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProvaStartWrapper } from "@/components/Prova/ProvaStartWrapper";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProvaPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const provaId = parseInt(id);

  const prova = await prisma.prova.findUnique({
      where: { id: provaId }
  });

  if (!prova) redirect("/dashboard");

  const tentativaAberta = await prisma.tentativaProva.findFirst({
     where: { usuarioId: user.id, provaId: prova.id, dataFim: null },
     include: { respostas: { include: { pergunta: { include: { respostas: true } }, respostasEscolhidas: true } } }
  });

  const provaSanitizada = { ...prova, notaCorte: Number(prova.notaCorte) };
  
  let tentativaSanitizada = null;
  if (tentativaAberta) {
     tentativaSanitizada = {
        ...tentativaAberta,
        prova: provaSanitizada,
        notaFinal: tentativaAberta.notaFinal ? Number(tentativaAberta.notaFinal) : null
     }
  }

  return (
    // @ts-ignore
    <MainLayout user={user}>
      <ProvaStartWrapper 
        prova={provaSanitizada} 
        tentativaAberta={tentativaSanitizada} 
      />
    </MainLayout>
  );
}