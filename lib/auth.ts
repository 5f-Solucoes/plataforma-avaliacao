import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || "fallback-secret");

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token");

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token.value, SECRET);
    const userId = Number(payload.userId);

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, nome: true, username: true, role: true, email: true }
    });

    return user;
  } catch (error) {
    return null;
  }
}