"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { hash } from "bcryptjs";

// Função para verificar se o usuário atual tem permissão de ADMIN, lançando um erro caso contrário
export async function getUsersAction() {
  const users = await prisma.usuario.findMany({
    orderBy: { nome: 'asc' }
  });
  return users;
}

// Ação para excluir um usuário, verificando se o usuário possui registros associados e inativando-o em vez de excluir, caso existam registros
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

// Ação para criar um novo usuário, validando os dados fornecidos e garantindo que o nome de usuário e e-mail sejam únicos
export async function createUserAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== "ADMIN") return { success: false, message: "Sem permissão." };

  const nome = formData.get("nome") as string;
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as "USER" | "INSTRUCTOR" | "ADMIN";
  const status = formData.get("status") as string; 

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

// Ação para atualizar os detalhes de um usuário existente, garantindo que apenas usuários com permissão ADMIN possam realizar a ação e que os dados sejam validados corretamente
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