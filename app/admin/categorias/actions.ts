"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";

// Função auxiliar para verificar permissões de usuário
async function checkPermission() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
    throw new Error("Sem permissão");
  }
}

// Ações para renomear e deletar categorias, garantindo que apenas usuários autorizados possam realizar essas operações
export async function renameCategoriaAction(oldName: string, newName: string) {
  try {
    await checkPermission();

    if (!newName.trim()) return { success: false, message: "O novo nome não pode ser vazio." };

    const result = await prisma.prova.updateMany({
      where: { categoria: oldName },
      data: { categoria: newName.trim() }
    });

    revalidatePath("/admin/categorias");
    revalidatePath("/admin/provas"); 
    
    return { success: true, message: `${result.count} prova(s) atualizada(s) para a nova categoria.` };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao renomear categoria." };
  }
}

// Ação para deletar uma categoria, definindo o campo categoria como null para as provas associadas
export async function deleteCategoriaAction(categoryName: string) {
  try {
    await checkPermission();

    const result = await prisma.prova.updateMany({
      where: { categoria: categoryName },
      data: { categoria: null }
    });

    revalidatePath("/admin/categorias");
    revalidatePath("/admin/provas");
    
    return { success: true, message: `Categoria removida de ${result.count} prova(s).` };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao remover categoria." };
  }
}