"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { hash } from "bcryptjs";

export async function getUsersAction() {
  const users = await prisma.usuario.findMany({
    orderBy: { nome: 'asc' }
  });
  return users;
}

export async function deleteUserAction(userId: number) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, message: "Acesso negado." };
  }

  if (currentUser.id === userId) {
    return { success: false, message: "Você não pode excluir a si mesmo." };
  }

  try {
    const temRegistros = await prisma.tentativaProva.findFirst({
        where: { usuarioId: userId }
    });

    if (temRegistros) {
        await prisma.usuario.update({
            where: { id: userId },
            data: { ativo: false }
        });
        revalidatePath("/admin/usuarios");
        return { success: true, message: "Usuário possuía registros e foi INATIVADO." };
    } else {
        await prisma.usuario.delete({
            where: { id: userId }
        });
        revalidatePath("/admin/usuarios");
        return { success: true, message: "Usuário excluído com sucesso." };
    }

  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao excluir usuário." };
  }

  
}

export async function createUserAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== "ADMIN") return { success: false, message: "Sem permissão." };

  const nome = formData.get("nome") as string;
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as "USER" | "INSTRUCTOR" | "ADMIN";
  const status = formData.get("status") as string; // "ATIVO" ou "INATIVO"

  if (!nome || !username || !email) {
    return { success: false, message: "Preencha todos os campos obrigatórios." };
  }

  try {
    const existe = await prisma.usuario.findFirst({
        where: { OR: [{ username }, { email }] }
    });
    if (existe) return { success: false, message: "Usuário ou E-mail já cadastrado." };

    const senhaHash = await hash("mudar123", 10);

    await prisma.usuario.create({
      data: {
        nome,
        username,
        email,
        role, 
        ativo: status === "ATIVO",
        senhaHash
      }
    });

    revalidatePath("/admin/usuarios");
    return { success: true, message: "Usuário criado com sucesso!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao criar usuário." };
  }
}

export async function updateUserAction(id: number, formData: FormData) {
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== "ADMIN") return { success: false, message: "Sem permissão." };

  const nome = formData.get("nome") as string;
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as "USER" | "INSTRUCTOR" | "ADMIN";
  const status = formData.get("status") as string;

  try {
    await prisma.usuario.update({
      where: { id },
      data: {
        nome,
        username,
        email,
        role,
        ativo: status === "ATIVO"
      }
    });

    revalidatePath("/admin/usuarios");
    return { success: true, message: "Usuário atualizado com sucesso!" };
  } catch (error) {
    return { success: false, message: "Erro ao atualizar (verifique se e-mail/user já existe)." };
  }
}