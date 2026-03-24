"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getCurrentUser } from "@/lib/auth";

async function checkPermission() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
    throw new Error("Sem permissão");
  }
}

export async function createGlobalQuestaoAction(formData: FormData) {
  try {
    await checkPermission();

    const enunciado = formData.get("enunciado") as string;
    const respostasStr = formData.get("respostas") as string;
    const provasIdsStr = formData.get("provasIds") as string;
    const imagem = formData.get("imagem") as File | null;

    if (!enunciado || !respostasStr) {
      return { success: false, message: "Enunciado e respostas são obrigatórios." };
    }

    const respostas = JSON.parse(respostasStr) as { texto: string; correta: boolean }[];
    const provasIds = provasIdsStr ? JSON.parse(provasIdsStr) as number[] : [];

    if (respostas.length < 2) {
      return { success: false, message: "A questão precisa de pelo menos 2 alternativas." };
    }

    if (!respostas.some(r => r.correta)) {
      return { success: false, message: "Selecione qual é a alternativa correta." };
    }

    let imagemUrl = null;

    if (imagem && imagem.size > 0) {
      const bytes = await imagem.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const nomeLimpo = imagem.name.replace(/[^a-zA-Z0-9.]/g, '');
      const uniqueName = `${Date.now()}-${nomeLimpo}`;
      
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'questoes');
      await mkdir(uploadDir, { recursive: true });
      
      const filePath = join(uploadDir, uniqueName);
      await writeFile(filePath, buffer);

      imagemUrl = `/uploads/questoes/${uniqueName}`;
    }

    await prisma.pergunta.create({
      data: {
        enunciado,
        imagemUrl,
        respostas: {
          create: respostas.map(r => ({
            textoAlternativa: r.texto,
            ehCorreta: r.correta
          }))
        },
        provas: {
          connect: provasIds.map(id => ({ id }))
        }
      }
    });

    revalidatePath("/admin/questoes");
    return { success: true, message: "Questão cadastrada no banco global!" };

  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao salvar a questão." };
  }
}

export async function updateGlobalQuestaoAction(formData: FormData) {
  try {
    const id = parseInt(formData.get("id") as string);
    const enunciado = formData.get("enunciado") as string;
    const respostasStr = formData.get("respostas") as string;
    const provasIdsStr = formData.get("provasIds") as string;
    const imagem = formData.get("imagem") as File | null;

    if (!enunciado || !respostasStr) {
      return { success: false, message: "Enunciado e respostas são obrigatórios." };
    }

    const respostas = JSON.parse(respostasStr) as { texto: string; correta: boolean }[];
    const provasIds = provasIdsStr ? JSON.parse(provasIdsStr) as number[] : [];

    const questaoAtual = await prisma.pergunta.findUnique({ where: { id } });
    let imagemUrl = questaoAtual?.imagemUrl || null;

    if (imagem && imagem.size > 0) {
      const bytes = await imagem.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uniqueName = `${Date.now()}-${imagem.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const filePath = join(process.cwd(), 'public', 'uploads', 'questoes', uniqueName);
      await writeFile(filePath, buffer);
      imagemUrl = `/uploads/questoes/${uniqueName}`;
    }

    await prisma.resposta.deleteMany({ where: { perguntaId: id } });

    await prisma.pergunta.update({
      where: { id },
      data: {
        enunciado,
        imagemUrl,
        respostas: {
          create: respostas.map(r => ({
            textoAlternativa: r.texto,
            ehCorreta: r.correta
          }))
        },
        provas: {
          set: provasIds.map(provaId => ({ id: provaId })) 
        }
      }
    });

    revalidatePath("/admin/questoes");
    return { success: true, message: "Questão atualizada com sucesso!" };

  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao atualizar a questão." };
  }
}

export async function deleteGlobalQuestaoAction(id: number) {
  try {
    await checkPermission();

    await prisma.resposta.deleteMany({ where: { perguntaId: id } });
    
    await prisma.pergunta.delete({ where: { id } });

    revalidatePath("/admin/questoes");
    return { success: true, message: "Questão removida com sucesso." };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao remover questão." };
  }
}