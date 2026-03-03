"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface RespostaInput {
  texto: string;
  correta: boolean;
}

export async function createQuestaoAction(provaId: number, enunciado: string, respostas: RespostaInput[]) {
  if (!enunciado || respostas.length < 2) {
    return { success: false, message: "A questão precisa de enunciado e pelo menos 2 alternativas." };
  }

  const temCorreta = respostas.some(r => r.correta);
  if (!temCorreta) {
    return { success: false, message: "Selecione qual é a alternativa correta." };
  }

  try {
    await prisma.pergunta.create({
      data: {
        enunciado,
        provaId,
        respostas: {
          create: respostas.map(r => ({
            textoAlternativa: r.texto,
            ehCorreta: r.correta
          }))
        }
      }
    });

    revalidatePath(`/admin/provas/${provaId}/questoes`);
    return { success: true, message: "Questão criada com sucesso!" };

  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao salvar questão." };
  }
}

export async function deleteQuestaoAction(perguntaId: number, provaId: number) {
  try {
    await prisma.resposta.deleteMany({ where: { perguntaId } });
    await prisma.pergunta.delete({ where: { id: perguntaId } });

    revalidatePath(`/admin/provas/${provaId}/questoes`);
    return { success: true, message: "Questão removida." };
  } catch (error) {
    return { success: false, message: "Erro ao remover questão." };
  }
}