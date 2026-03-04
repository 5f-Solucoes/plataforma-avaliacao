"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";

async function checkPermission() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
    throw new Error("Sem permissão");
  }
}

export async function saveFabricanteAction(id: number | null, formData: FormData) {
  try {
    await checkPermission();

    const nome = formData.get("nome") as string;
    const site = formData.get("site") as string | null;
    const areaAtuacao = formData.get("areaAtuacao") as string | null;

    if (!nome) return { success: false, message: "O nome é obrigatório." };

    if (id) {
      await prisma.fabricante.update({
        where: { id },
        data: { nome, site, areaAtuacao }
      });
      revalidatePath("/admin/fabricantes");
      return { success: true, message: "Fabricante atualizado com sucesso!" };
    } else {
      await prisma.fabricante.create({
        data: { nome, site, areaAtuacao }
      });
      revalidatePath("/admin/fabricantes");
      return { success: true, message: "Fabricante cadastrado com sucesso!" };
    }
  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao salvar fabricante." };
  }
}

export async function deleteFabricanteAction(id: number) {
  try {
    await checkPermission();

    const provasVinculadas = await prisma.prova.count({
      where: { fabricanteId: id }
    });

    if (provasVinculadas > 0) {
      return { 
        success: false, 
        message: `Não é possível excluir. Existem ${provasVinculadas} prova(s) vinculada(s) a este fabricante.` 
      };
    }

    await prisma.fabricante.delete({ where: { id } });
    revalidatePath("/admin/fabricantes");
    return { success: true, message: "Fabricante excluído com sucesso." };

  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao excluir fabricante." };
  }
}