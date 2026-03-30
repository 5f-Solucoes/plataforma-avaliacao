import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;

  // Bloqueia tentativa de path traversal
  const safePath = pathSegments.join("/");
  if (safePath.includes("..") || safePath.includes("~")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const filePath = join(process.cwd(), "public", "uploads", safePath);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }

  try {
    const fileBuffer = await readFile(filePath);
    const ext = "." + safePath.split(".").pop()?.toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Erro ao ler arquivo" }, { status: 500 });
  }
}
