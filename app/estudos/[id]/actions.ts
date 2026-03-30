"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// Ações para criar e deletar materiais de estudo
export async function createEstudoAction(provaId: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
    return { success: false, message: "Sem permissão." };
  }

  try {
    const titulo = formData.get("titulo") as string;
    const tipo = formData.get("tipo") as string;
    const descricao = formData.get("descricao") as string;
    
    let url = formData.get("url") as string | null;
    
    const arquivo = formData.get("arquivo") as File | null;

    if (!titulo || !tipo) return { success: false, message: "Título e Tipo obrigatórios." };

    if (arquivo && arquivo.size > 0) {
      const bytes = await arquivo.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const nomeLimpo = arquivo.name.replace(/[^a-zA-Z0-9.]/g, '');
      const uniqueName = `${Date.now()}-${nomeLimpo}`;
      
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'estudos');
      await mkdir(uploadDir, { recursive: true });
      
      const filePath = join(uploadDir, uniqueName);
      await writeFile(filePath, buffer);

      url = `/uploads/estudos/${uniqueName}`;
    }

    await prisma.materialEstudo.create({
      data: { provaId, titulo, descricao, tipo, url }
    });

    revalidatePath(`/estudos/${provaId}`);
    return { success: true, message: "Material adicionado com sucesso!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao salvar material." };
  }
}

// Ação para deletar um material de estudo
export async function deleteEstudoAction(materialId: number, provaId: number) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
    return { success: false, message: "Sem permissão." };
  }

  try {
    await prisma.materialEstudo.delete({ where: { id: materialId } });
    revalidatePath(`/estudos/${provaId}`);
    return { success: true, message: "Material removido!" };
  } catch (error) {
    return { success: false, message: "Erro ao remover material." };
  }
}