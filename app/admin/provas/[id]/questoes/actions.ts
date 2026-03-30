"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

interface RespostaInput {
  texto: string;
  correta: boolean;
}

// Ação para criar uma nova questão, incluindo o upload de imagem e validação dos dados fornecidos
export async function createQuestaoAction(provaId: number, formData: FormData) {
  const enunciado = formData.get("enunciado") as string;
  const respostasStr = formData.get("respostas") as string;
  const imagem = formData.get("imagem") as File | null;

  if (!enunciado || !respostasStr) {
    return { success: false, message: "Enunciado e respostas são obrigatórios." };
  }

  const respostas = JSON.parse(respostasStr) as { texto: string; correta: boolean }[];

  if (respostas.length < 2) {
    return { success: false, message: "A questão precisa de pelo menos 2 alternativas." };
  }

  const temCorreta = respostas.some(r => r.correta);
  if (!temCorreta) {
    return { success: false, message: "Selecione qual é a alternativa correta." };
  }

  let imagemUrl = null;

  if (imagem && imagem.size > 0) {
    try {
      const bytes = await imagem.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const nomeLimpo = imagem.name.replace(/[^a-zA-Z0-9.]/g, '');
      const uniqueName = `${Date.now()}-${nomeLimpo}`;
      
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'questoes');
      
      await mkdir(uploadDir, { recursive: true });
      
      const filePath = join(uploadDir, uniqueName);
      await writeFile(filePath, buffer);

      imagemUrl = `/uploads/questoes/${uniqueName}`;
    } catch (e) {
      console.error("Erro no upload da imagem:", e);
      return { success: false, message: "Erro ao salvar a imagem." };
    }
  }

  try {
    await prisma.pergunta.create({
      data: {
        enunciado,
        imagemUrl,
        provas: {
          connect: { id: provaId }
        },
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

// Ação para deletar uma questão, removendo também as respostas associadas
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