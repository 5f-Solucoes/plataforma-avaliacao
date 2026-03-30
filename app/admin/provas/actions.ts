"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Ação para criar uma nova prova, validando os dados fornecidos e garantindo que o nome e fabricante sejam obrigatórios
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

// Ação para atualizar os detalhes de uma prova existente, garantindo que os dados sejam validados antes de salvar
export async function updateProvaAction(formData: FormData) {
  try {
    const id = parseInt(formData.get("id") as string);
    const nome = formData.get("nome") as string;
    const fabricanteId = parseInt(formData.get("fabricanteId") as string);
    const categoria = formData.get("categoria") as string;
    const tempoLimiteMinutos = parseInt(formData.get("tempoLimite") as string);
    const qtdPerguntasSorteio = parseInt(formData.get("qtdPerguntas") as string);
    const notaCorte = parseFloat(formData.get("notaCorte") as string);
    const validadeMeses = parseInt(formData.get("validadeMeses") as string);

    await prisma.prova.update({
      where: { id },
      data: { nome, fabricanteId, categoria, tempoLimiteMinutos, qtdPerguntasSorteio, notaCorte, validadeMeses }
    });

    revalidatePath("/admin/provas");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Erro ao atualizar prova." };
  }
}

// Ação para deletar uma prova, garantindo que as questões e tentativas associadas sejam tratadas adequadamente
export async function deleteProvaAction(id: number) {
  try {
    await prisma.prova.delete({ where: { id } });
    revalidatePath("/admin/provas");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Erro ao excluir prova. Pode haver questões ou tentativas vinculadas." };
  }
}

export async function updateProvaAccessAction(provaId: number, userIds: number[]) {
  try {
    await prisma.prova.update({
      where: { id: provaId },
      data: {
        usuariosPermitidos: {
          set: userIds.map(id => ({ id }))
        }
      }
    });

    revalidatePath("/admin/provas");
    return { success: true, message: "Acessos atualizados com sucesso!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao atualizar acessos." };
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

export async function createMaterialAction(provaId: number, formData: FormData) {
  try {
    const titulo = formData.get("titulo") as string;
    const descricao = formData.get("descricao") as string;
    const tipo = formData.get("tipo") as string;
    const url = formData.get("url") as string;

    if (!titulo || !tipo) {
      return { success: false, message: "Título e Tipo são obrigatórios." };
    }

    await prisma.materialEstudo.create({
      data: {
        provaId,
        titulo,
        descricao,
        tipo,
        url
      }
    });

    // Atualiza a página para mostrar o novo material na tabela
    revalidatePath("/admin/provas");
    return { success: true, message: "Material adicionado com sucesso!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao salvar material." };
  }
}

// Ação para deletar um material de estudo, removendo-o da prova associada
export async function deleteMaterialAction(id: number) {
  try {
    await prisma.materialEstudo.delete({ where: { id } });
    revalidatePath("/admin/provas");
    return { success: true, message: "Material removido!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao remover material." };
  }
}