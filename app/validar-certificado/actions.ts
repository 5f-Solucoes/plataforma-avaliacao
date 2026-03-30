"use server";

import { prisma } from "@/lib/prisma";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Ação para validar um certificado com base no código de autenticação (UUID), verificando sua existência, validade e retornando informações relevantes
export async function validarCertificadoAction(codigo: string) {
  const codigoTrimmed = codigo.trim();

  if (!UUID_REGEX.test(codigoTrimmed)) {
    return { success: false, message: "Código inválido. O formato deve ser um UUID (ex: 550e8400-e29b-41d4-a716-446655440000)." };
  }

  const certificado = await prisma.certificado.findUnique({
    where: { codigoAutenticacao: codigoTrimmed },
    include: {
      usuario: { select: { nome: true } },
      tentativa: {
        include: {
          prova: {
            include: { fabricante: true }
          }
        }
      }
    }
  });

  if (!certificado) {
    return { success: false, message: "Nenhum certificado encontrado com este código." };
  }

  const agora = new Date();
  const valido = certificado.dataValidade ? certificado.dataValidade > agora : true;

  return {
    success: true,
    certificado: {
      nomeUsuario: certificado.usuario.nome,
      nomeProva: certificado.tentativa.prova.nome,
      fabricante: certificado.tentativa.prova.fabricante?.nome || null,
      notaFinal: certificado.tentativa.notaFinal ? Number(certificado.tentativa.notaFinal) : null,
      dataEmissao: certificado.dataEmissao.toISOString(),
      dataValidade: certificado.dataValidade?.toISOString() || null,
      codigoAutenticacao: certificado.codigoAutenticacao,
      valido,
    }
  };
}
