"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { hash, compare } from "bcryptjs"; 

// Ações relacionadas às configurações do usuário, incluindo atualização de perfil e alteração de senha, garantindo que apenas usuários autenticados possam realizar essas ações
export async function updateProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autorizado." };

  const nome = formData.get("nome") as string;
  const email = formData.get("email") as string;

  try {
    await prisma.usuario.update({
      where: { id: user.id },
      data: { nome, email }
    });

    revalidatePath("/configuracoes");
    return { success: true, message: "Perfil atualizado com sucesso!" };
  } catch (error) {
    return { success: false, message: "Erro ao atualizar (e-mail já em uso?)." };
  }
}

// Ação para alterar a senha do usuário, validando a senha atual e garantindo que a nova senha seja confirmada corretamente, além de proteger a ação para usuários autenticados
export async function changePasswordAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autorizado." };

  const senhaAtual = formData.get("senhaAtual") as string;
  const novaSenha = formData.get("novaSenha") as string;
  const confirmarSenha = formData.get("confirmarSenha") as string;

  if (novaSenha !== confirmarSenha) {
    return { success: false, message: "A nova senha e a confirmação não conferem." };
  }

  const usuarioDb = await prisma.usuario.findUnique({ 
    where: { id: user.id } 
  });

  if (!usuarioDb) return { success: false, message: "Usuário não encontrado." };

  const senhaCorreta = await compare(senhaAtual, usuarioDb.senhaHash);
  if (!senhaCorreta) {
    return { success: false, message: "Sua senha atual está incorreta." };
  }

  const novaHash = await hash(novaSenha, 10);

  await prisma.usuario.update({
    where: { id: user.id },
    data: { senhaHash: novaHash }
  });

  return { success: true, message: "Senha alterada com sucesso!" };
}