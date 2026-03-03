"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";


export async function criarProva(formData: FormData) {
  const nome = formData.get("nome") as string;
  const categoria = formData.get("categoria") as string;
  const tempo = Number(formData.get("tempo"));
  const notaCorte = Number(formData.get("notaCorte"));

  await prisma.prova.create({
    data: {
      nome,
      categoria,
      tempoLimiteMinutos: tempo,
      qtdPerguntasSorteio: 10,
      notaCorte: notaCorte,
      validadeMeses: 12,
    },
  });


  revalidatePath("/dashboard");
  revalidatePath("/admin/provas");

  
}

export async function logoutAction() {
  const cookieStore = await cookies();
  
  cookieStore.delete("session_token");
  cookieStore.delete("mfa_pending");
  
  redirect("/login");
}
