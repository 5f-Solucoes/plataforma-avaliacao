"use server";

import { prisma } from "@/lib/prisma";
import { iniciarTransacaoPush, verificarStatusTransacao } from "@/lib/watchguard";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs"; 

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || "fallback-secret");

export async function loginAction(prevState: any, formData: FormData) {
  const loginIdentifier = formData.get("login_identifier") as string;
  const senha = formData.get("senha") as string;

  if (!loginIdentifier || !senha) {
    return { success: false, message: "Preencha usuário e senha." };
  }

  const user = await prisma.usuario.findFirst({
    where: {
      OR: [
        { username: { equals: loginIdentifier, mode: 'insensitive' } }, 
        { email: { equals: loginIdentifier, mode: 'insensitive' } }
      ]
    }
  });

  if (!user) {
    return { success: false, message: "Usuário não encontrado na base local." };
  }

  const clientIp = "127.0.0.1"; 

  const wgResult = await iniciarTransacaoPush(user.id, senha, clientIp);

  if (!wgResult.success) {
    return { success: false, message: wgResult.error || "Falha na autenticação (MFA/Senha)." };
  }

  const senhaLocalBate = await bcrypt.compare(senha, user.senhaHash);

  if (!senhaLocalBate) {
    console.log(`🔄 Senha do usuário ${user.username} mudou no AD. Sincronizando DB local...`);
    const novaHash = await bcrypt.hash(senha, 10);
    
    await prisma.usuario.update({
      where: { id: user.id },
      data: { senhaHash: novaHash }
    });
    console.log("✅ Senha sincronizada.");
  }

  const cookieStore = await cookies();

  const pendingToken = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("5m")
    .sign(SECRET);

  cookieStore.set("mfa_pending", pendingToken, { httpOnly: true, maxAge: 300 });

  return { 
    success: true, 
    transactionId: wgResult.transactionId,
    message: "Push enviado!" 
  };
}

export async function checkMfaStatusAction(transactionId: string) {
  const status = await verificarStatusTransacao(transactionId);

  if (status === "AUTHORIZED") {
    const cookieStore = await cookies();
    const pendingCookie = cookieStore.get("mfa_pending");
    
    if (!pendingCookie) {
        return { status: "ERROR", message: "Sessão expirada." };
    }

    try {
      const { payload } = await jwtVerify(pendingCookie.value, SECRET);
      const userId = Number(payload.userId);

      const sessionToken = await new SignJWT({ userId: userId })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("8h")
        .sign(SECRET);

      cookieStore.set("session_token", sessionToken, { httpOnly: true, maxAge: 28800 });
      cookieStore.delete("mfa_pending");

      return { status: "AUTHORIZED", redirect: "/dashboard" };
    } catch (e) {
      return { status: "ERROR", message: "Falha na verificação de sessão." };
    }
  }

  return { status };
}