"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

export async function iniciarOuRetomarProva(provaId: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado");

  const prova = await prisma.prova.findUnique({
    where: { id: provaId },
    include: { perguntas: { select: { id: true } } }
  });

  if (!prova) throw new Error("Prova não encontrada");

  const tentativaAberta = await prisma.tentativaProva.findFirst({
    where: {
      usuarioId: user.id,
      provaId: prova.id,
      dataFim: null,
    },
    include: {
      respostas: {
        include: {
          pergunta: { include: { respostas: true } }
        }
      }
    }
  });

  if (tentativaAberta) {
    return tentativaAberta;
  }


  const shuffledPerguntas = prova.perguntas.sort(() => 0.5 - Math.random());
  const perguntasSorteio = shuffledPerguntas.slice(0, prova.qtdPerguntasSorteio);

  const novaTentativa = await prisma.tentativaProva.create({
    data: {
      usuarioId: user.id,
      provaId: prova.id,
      respostas: {
        create: perguntasSorteio.map((p) => ({
          perguntaId: p.id,
          respostaEscolhidaId: null 
        }))
      }
    },
    include: {
      respostas: {
        include: {
          pergunta: { include: { respostas: true } }
        }
      }
    }
  });

  return novaTentativa;
}

export async function salvarRespostaParcial(tentativaRespostaId: number, respostaId: number) {
  await prisma.tentativaResposta.update({
    where: { id: tentativaRespostaId },
    data: { respostaEscolhidaId: respostaId }
  });
  return true;
}

export async function finalizarProva(tentativaId: number) {
  const tentativa = await prisma.tentativaProva.findUnique({
    where: { id: tentativaId },
    include: {
      prova: true,
      respostas: { include: { resposta: true } }
    }
  });

  if (!tentativa || tentativa.dataFim) return { success: false, message: "Tentativa já finalizada." };

  let acertos = 0;
  tentativa.respostas.forEach((tr) => {
    if (tr.resposta?.ehCorreta) acertos++;
  });

  const totalQuestoes = tentativa.prova.qtdPerguntasSorteio;
  const notaFinal = totalQuestoes > 0 ? (acertos / totalQuestoes) * 10 : 0;
  const aprovado = notaFinal >= tentativa.prova.notaCorte.toNumber();

  await prisma.tentativaProva.update({
    where: { id: tentativaId },
    data: {
      dataFim: new Date(),
      notaFinal: notaFinal,
      aprovado: aprovado
    }
  });

  if (aprovado) {
    let dataValidade = null;
    if (tentativa.prova.validadeMeses && tentativa.prova.validadeMeses > 0) {
      dataValidade = new Date();
      dataValidade.setMonth(dataValidade.getMonth() + tentativa.prova.validadeMeses);
    }

    await prisma.certificado.create({
      data: {
        usuarioId: tentativa.usuarioId,
        tentativaId: tentativa.id,
        codigoAutenticacao: randomBytes(4).toString('hex').toUpperCase(),
        dataValidade: dataValidade
      }
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/perfil");

  return { success: true, nota: notaFinal, aprovado };
}