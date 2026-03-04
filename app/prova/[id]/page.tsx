import { MainLayout } from "@/components/MainLayout";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { iniciarOuRetomarProva } from "@/app/prova/[id]/actions"; 
import { ExamRunner } from "@/components/Prova/ExamRunner"; 
import { prisma } from "@/lib/prisma";

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

  const tentativaAberta = await iniciarOuRetomarProva(provaId);


  const tentativaSanitizada = {
    ...tentativaAberta,
    prova: prova, 
    notaFinal: tentativaAberta.notaFinal ? Number(tentativaAberta.notaFinal) : null,
  };

  return (
    // @ts-ignore
    <MainLayout user={user}>
      <ExamRunner 
        tentativa={tentativaSanitizada} 
        tempoLimiteMinutos={prova.tempoLimiteMinutos} 
      />
    </MainLayout>
  );
}