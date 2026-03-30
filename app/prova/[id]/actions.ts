"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

// Ações relacionadas à prova, como iniciar, salvar respostas parciais e finalizar a prova
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
          pergunta: { include: { respostas: true } },
          respostasEscolhidas: true
        }
      }
    }
  });

  if (tentativaAberta) {
    const inicio = new Date(tentativaAberta.dataInicio).getTime();
    const agora = Date.now();
    
    const limiteMs = (prova.tempoLimiteMinutos * 60 * 1000) + 60000;

    if (agora - inicio > limiteMs) {
      await prisma.tentativaProva.update({
        where: { id: tentativaAberta.id },
        data: {
          dataFim: new Date(),
          notaFinal: 0,
          aprovado: false
        }
      });
    } else {
      tentativaAberta.respostas.forEach(tr => {
         tr.pergunta.respostas.sort(() => Math.random() - 0.5);
      });
      return tentativaAberta;
    }
  }

  const shuffledPerguntas = prova.perguntas.sort(() => 0.5 - Math.random());
  
  const perguntasSorteio = shuffledPerguntas.slice(0, prova.qtdPerguntasSorteio);

  const novaTentativa = await prisma.tentativaProva.create({
    data: {
      usuarioId: user.id,
      provaId: prova.id,
      respostas: {
        create: perguntasSorteio.map((p) => ({
          perguntaId: p.id
        }))
      }
    },
    include: {
      respostas: {
        include: {
          pergunta: { include: { respostas: true } },
          respostasEscolhidas: true
        }
      }
    }
  });

  novaTentativa.respostas.forEach(tr => {
    tr.pergunta.respostas.sort(() => Math.random() - 0.5);
  });

  return novaTentativa;
}

// Salva respostas parciais durante a prova, permitindo que o usuário retome posteriormente
export async function salvarRespostaParcial(tentativaRespostaId: number, respostaIds: number[]) {
  await prisma.tentativaResposta.update({
    where: { id: tentativaRespostaId },
    data: {
      respostasEscolhidas: {
        set: respostaIds.map(id => ({ id }))
      }
    }
  });
  return true;
}

// Finaliza a prova, calculando a nota final, determinando aprovação e gerando certificado se necessário
export async function finalizarProva(provaId: number, respostas: Record<number, number[]>) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autenticado" };

  const tentativa = await prisma.tentativaProva.findFirst({
    where: { usuarioId: user.id, provaId, dataFim: null },
    include: { respostas: { include: { pergunta: { include: { respostas: true } }, respostasEscolhidas: true } } }
  });

  if (!tentativa) return { success: false, message: "Nenhuma prova em andamento encontrada." };

  const prova = await prisma.prova.findUnique({ where: { id: provaId } });
  if (!prova) return { success: false, message: "Prova não encontrada." };

  let acertos = 0;
  const total = tentativa.respostas.length;

  for (const tr of tentativa.respostas) {
    const respostasIds = respostas[tr.pergunta.id] || [];

    if (respostasIds.length > 0) {
      await prisma.tentativaResposta.update({
        where: { id: tr.id },
        data: {
          respostasEscolhidas: {
            set: respostasIds.map(id => ({ id }))
          }
        }
      });

      const corretas = new Set(tr.pergunta.respostas.filter((r: any) => r.ehCorreta).map((r: any) => r.id));
      const escolhidas = new Set(respostasIds);

      const acertou = corretas.size === escolhidas.size &&
        [...corretas].every(id => escolhidas.has(id));

      if (acertou) acertos++;
    }
  }

  const notaFinal = (acertos / total) * 10;
  const aprovado = notaFinal >= Number(prova.notaCorte);

  await prisma.tentativaProva.update({
    where: { id: tentativa.id },
    data: {
      dataFim: new Date(), 
      notaFinal,
      aprovado
    }
  });

  if (aprovado) {
    const validadeEmMeses = prova.validadeMeses || 12;
    const dataValidade = new Date();
    dataValidade.setMonth(dataValidade.getMonth() + validadeEmMeses);

    await prisma.certificado.create({
       data: {
         usuarioId: user.id,
         tentativaId: tentativa.id,
         codigoAutenticacao: crypto.randomUUID(), 
         dataValidade: dataValidade
       }
    });
  }

  return { 
    success: true, 
    nota: notaFinal, 
    aprovado, 
    notaCorte: Number(prova.notaCorte) 
  };
}