"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

export async function submitProvaAction(provaId: number, respostasUsuario: Record<number, number>) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Usuário não logado." };

  const prova = await prisma.prova.findUnique({
    where: { id: provaId },
    include: {
      perguntas: {
        include: { respostas: true }
      }
    }
  });

  if (!prova) return { success: false, message: "Prova não encontrada." };

  let acertos = 0;
  const totalQuestoes = prova.perguntas.length;

  const tentativasRespostaData = [];

  for (const pergunta of prova.perguntas) {
    const respostaEscolhidaId = respostasUsuario[pergunta.id];
    
    if (!respostaEscolhidaId) continue;

    const respostaCorreta = pergunta.respostas.find(r => r.ehCorreta);
    const acertou = respostaCorreta?.id === respostaEscolhidaId;

    if (acertou) acertos++;

    tentativasRespostaData.push({
      pergunta: { connect: { id: pergunta.id } },
      resposta: { connect: { id: respostaEscolhidaId } }
    });
  }

  const notaFinal = totalQuestoes > 0 ? (acertos / totalQuestoes) * 10 : 0;
  const aprovado = notaFinal >= prova.notaCorte.toNumber();

  const tentativa = await prisma.tentativaProva.create({
    data: {
      usuarioId: user.id,
      provaId: prova.id,
      notaFinal: notaFinal,
      aprovado: aprovado,
      respostas: {
        create: tentativasRespostaData 
      }
    }
  });

  if (aprovado) {
    const codigo = randomBytes(4).toString('hex').toUpperCase();

    let dataValidade = null;
    if (prova.validadeMeses && prova.validadeMeses > 0) {
        dataValidade = new Date();
        dataValidade.setMonth(dataValidade.getMonth() + prova.validadeMeses);
    }

    await prisma.certificado.create({
      data: {
        usuarioId: user.id,
        tentativaId: tentativa.id,
        codigoAutenticacao: codigo,
        dataValidade: dataValidade
      }
    });

    revalidatePath("/perfil");
  }

  revalidatePath("/dashboard");
  
  return { 
    success: true, 
    aprovado: aprovado, 
    nota: notaFinal,
    notaCorte: prova.notaCorte.toNumber()
  };
}