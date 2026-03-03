import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

const CONFIG = {
  accessId: process.env.WATCHGUARD_ACCESS_ID!,
  clientSecret: process.env.WATCHGUARD_CLIENT_SECRET!,
  authUrl: process.env.WATCHGUARD_AUTH_URL!,
  apiBase: process.env.WATCHGUARD_API_BASE!,
  apiKey: process.env.WATCHGUARD_API_KEY!,
  accountId: process.env.WATCHGUARD_ACCOUNT_ID!,
  resourceId: process.env.WATCHGUARD_RESOURCE_ID!,
};

async function getToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const credentials = btoa(`${CONFIG.accessId}:${CONFIG.clientSecret}`);
  
  const response = await fetch(CONFIG.authUrl, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Dev.5F.AuthPointClient/1.0"
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "api-access"
    })
  });

  if (!response.ok) {
    throw new Error(`Falha ao obter Token WG: ${await response.text()}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = now + (3500 * 1000); 
  
  return cachedToken!;
}

async function callApi(method: string, path: string, body: any = null) {
  const token = await getToken();
  const url = `${CONFIG.apiBase.replace(/\/$/, "")}/authpoint/authentication/v1${path}`;

  const options: RequestInit = {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "WatchGuard-API-Key": CONFIG.apiKey,
      "Accept": "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Dev.5F.AuthPointClient/1.0"
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  return {
    status: response.status,
    body: await response.json().catch(() => ({})),
    ok: response.ok
  };
}

export async function iniciarTransacaoPush(usuarioId: number, passwordPlain: string, clientIp: string) {
  const user = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!user) throw new Error("Usuário não encontrado");

  const endpoint = `/accounts/${CONFIG.accountId}/resources/${CONFIG.resourceId}/transactions`;

  const body = {
    login: user.username, 
    type: "PUSH",
    password: passwordPlain,
    originIpAddress: clientIp || null
  };

  console.log(`WG Auth Iniciando para ${user.username}. IP: ${clientIp}`);

  try {
    const response = await callApi("POST", endpoint, body);

    if (response.status < 200 || response.status >= 300) {
      console.warn("WatchGuard Recusou:", response.body);
      return {
        success: false,
        error: response.body.error_description || response.body.error || "Falha MFA",
        wg_status: response.status
      };
    }
    const senhaCorretaLocalmente = await bcrypt.compare(passwordPlain, user.senhaHash);

    if (!senhaCorretaLocalmente) {
      console.log(`Senha do AD difere da local. Sincronizando para: ${user.username}...`);
      try {
        const novaHash = await bcrypt.hash(passwordPlain, 10);
        await prisma.usuario.update({
          where: { id: user.id },
          data: { senhaHash: novaHash }
        });
        console.log("Senha sincronizada com sucesso!");
      } catch (e) {
        console.error("ERRO AO ATUALIZAR SENHA NO BANCO:", e);
      }
    }

    const txBody = response.body;
    const txId = txBody.transactionId || txBody.id || null;

    return {
      success: true,
      transactionId: txId,
      details: txBody
    };

  } catch (e: any) {
    console.error("Erro WatchGuard:", e.message);
    return { success: false, error: "Erro interno MFA" };
  }
}

export async function verificarStatusTransacao(txId: string) {
  const endpoint = `/accounts/${CONFIG.accountId}/resources/${CONFIG.resourceId}/transactions/${txId}`;

  try {
    const response = await callApi("GET", endpoint);

    if (response.status === 202) return "PENDING";
    if (response.status < 200 || response.status >= 300) return "ERROR";

    const body = response.body;
    
    const statusCandidates = [
      body.status,
      body.pushResult,
      body.authenticationResult,
      body.result,
      body.transaction?.status
    ];

    let resultStatus = "PENDING";
    for (const c of statusCandidates) {
      if (c && typeof c === "string") {
        resultStatus = c;
        break;
      }
      if (c && typeof c === "object" && c.status) {
        resultStatus = c.status;
        break;
      }
    }

    const resultNorm = resultStatus.toUpperCase().trim();

    if (["AUTHORIZED", "AUTHORISED", "SUCCESS", "OK"].includes(resultNorm)) return "AUTHORIZED";
    if (["DENIED", "FAILED", "UNAUTHORIZED", "REJECTED"].includes(resultNorm)) return "DENIED";

    return "PENDING";

  } catch (e) {
    return "ERROR";
  }
}
