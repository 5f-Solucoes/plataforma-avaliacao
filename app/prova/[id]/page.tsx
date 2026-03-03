import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MainLayout } from "@/components/MainLayout";
import { notFound, redirect } from "next/navigation";
import { ProvaRunner } from "@/components/Prova/ProvaRunner";


interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProvaPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const provaId = parseInt(id);

  const prova = await prisma.prova.findUnique({
    where: { id: provaId },
    include: {
      perguntas: {
        include: { respostas: true }
      }
    }
  });

  if (!prova) notFound();

  if (!prova.validadeMeses || prova.validadeMeses <= 0) {
    return (
        // @ts-ignore
        <MainLayout user={user}>
            <div>Esta prova não está disponível ou foi desativada.</div>
        </MainLayout>
    );
    
  }

  const certificadoValido = await prisma.certificado.findFirst({
    where: {
        usuarioId: user.id,
        tentativa: { provaId: provaId },
        dataValidade: { gt: new Date() } // Validade no futuro
    }
  });

  if (certificadoValido) {
    return (
        // @ts-ignore
        <MainLayout user={user}>
            <div style={{ textAlign: 'center', marginTop: 50 }}>
                <h2>Você já possui um certificado válido para esta prova.</h2>
                <p>Não é necessário realizar a avaliação novamente no momento.</p>
                <a href="/perfil" style={{ color: 'blue', textDecoration: 'underline' }}>Ver meus certificados</a>
            </div>
        </MainLayout>
    );
  }

  const perguntasLimpas = prova.perguntas.map(p => ({
    id: p.id,
    enunciado: p.enunciado,
    respostas: p.respostas.map(r => ({
        id: r.id,
        textoAlternativa: r.textoAlternativa
    }))
  }));

  return (
    // @ts-ignore
    <MainLayout user={user}>
      <ProvaRunner 
        prova={{
            id: prova.id,
            nome: prova.nome,
            tempoLimiteMinutos: prova.tempoLimiteMinutos
        }}
        perguntas={perguntasLimpas}
      />
    </MainLayout>
  );
}