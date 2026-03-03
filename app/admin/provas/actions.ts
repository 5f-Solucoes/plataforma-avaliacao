"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProvaAction(formData: FormData) {
  const nome = formData.get("nome") as string;
  const categoria = formData.get("categoria") as string;
  const fabricanteId = Number(formData.get("fabricanteId"));
  const tempoLimite = Number(formData.get("tempoLimite"));
  const qtdPerguntas = Number(formData.get("qtdPerguntas"));
  const notaCorte = Number(formData.get("notaCorte")); 
  const validadeMeses = Number(formData.get("validadeMeses"));

  if (!nome || !fabricanteId) {
    return { success: false, message: "Campos obrigatórios faltando." };
  }

  try {
    await prisma.prova.create({
      data: {
        nome,
        categoria,
        fabricanteId,
        tempoLimiteMinutos: tempoLimite,
        qtdPerguntasSorteio: qtdPerguntas,
        notaCorte: notaCorte, 
        validadeMeses: validadeMeses,
      },
    });

    revalidatePath("/admin/provas"); 
    revalidatePath("/dashboard");    
    return { success: true, message: "Prova criada com sucesso!" };

  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao criar prova." };
  }
}

export async function toggleStatusProvaAction(id: number, currentValidade: number) {
  const novaValidade = currentValidade > 0 ? 0 : 12;

  await prisma.prova.update({
    where: { id },
    data: { validadeMeses: novaValidade }
  });

  revalidatePath("/admin/provas");
  revalidatePath("/dashboard");
  return { success: true };
}