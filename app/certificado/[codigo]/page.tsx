import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Container, Text, Box, Group } from "@mantine/core";
import { CertificateControls } from "@/components/Certificado/CertificateControls";
import Image from "next/image";

export const metadata = { title: "Certificado" };

interface PageProps {
  params: Promise<{ codigo: string }>;
}

const ROXO = "#643289";
const AZUL = "#193861";

// Página de visualização de certificado, acessível apenas para o usuário proprietário do certificado ou para usuários com permissão ADMIN
export default async function CertificadoViewPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { codigo } = await params;

  const certificado = await prisma.certificado.findUnique({
    where: { codigoAutenticacao: codigo },
    include: {
      usuario: true,
      tentativa: {
        include: { prova: { include: { fabricante: true } } }
      }
    }
  });

  if (!certificado) notFound();

  if (certificado.usuarioId !== user.id && user.role !== "ADMIN") {
     return <div>Acesso negado.</div>;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f0f0" }}>
        <div className="print-hidden">
            <Container size="sm" py="sm">
                <CertificateControls
                  nomeUsuario={certificado.usuario.nome}
                  nomeProva={certificado.tentativa.prova.nome}
                  dataEmissao={certificado.dataEmissao}
                />
            </Container>
        </div>

        <Container size="md" py="xl">
            <div
                id="certificado-content"
                style={{
                    backgroundColor: "#ffffff",
                    padding: "50px 60px",
                    position: "relative",
                    overflow: "hidden",
                    minHeight: "500px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    border: `3px solid ${AZUL}`,
                }}
            >
                <div style={{
                    position: "absolute",
                    inset: "8px",
                    border: `1px solid ${ROXO}`,
                    pointerEvents: "none",
                }} />

                <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "6px",
                    background: `linear-gradient(90deg, ${AZUL} 0%, ${ROXO} 100%)`,
                }} />

                <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "6px",
                    background: `linear-gradient(90deg, ${ROXO} 0%, ${AZUL} 100%)`,
                }} />

                <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                    <div style={{ marginBottom: "20px" }}>
                        <Image
                            src="/images/logo.svg"
                            alt="Logo"
                            width={120}
                            height={120}
                            style={{ objectFit: "contain" }}
                        />
                    </div>

                    <h1 style={{
                        fontSize: "28px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "4px",
                        color: AZUL,
                        margin: "0 0 6px 0",
                    }}>
                        Certificado de Conclusão
                    </h1>

                    <div style={{
                        width: "80px",
                        height: "3px",
                        backgroundColor: ROXO,
                        margin: "0 auto 30px auto",
                    }} />

                    <Text size="sm" style={{ color: "#555", marginBottom: "8px" }}>
                        Certificamos que
                    </Text>

                    <h2 style={{
                        fontSize: "32px",
                        fontWeight: 700,
                        color: ROXO,
                        margin: "0 0 8px 0",
                        lineHeight: 1.2,
                    }}>
                        {certificado.usuario.nome}
                    </h2>

                    <Text size="sm" style={{ color: "#555", marginBottom: "24px" }}>
                        Concluiu com aproveitamento a avaliação
                    </Text>

                    <h3 style={{
                        fontSize: "22px",
                        fontWeight: 700,
                        color: AZUL,
                        margin: "0 0 4px 0",
                    }}>
                        {certificado.tentativa.prova.nome}
                    </h3>

                    {certificado.tentativa.prova.fabricante && (
                        <Text size="sm" style={{ color: "#666", marginBottom: "30px" }}>
                            {certificado.tentativa.prova.fabricante.nome}
                        </Text>
                    )}

                    <div style={{
                        width: "60%",
                        height: "1px",
                        backgroundColor: "#ddd",
                        margin: "20px auto 24px auto",
                    }} />

                    <Group gap={60} justify="center" wrap="wrap">
                        <Box style={{ textAlign: "center" }}>
                            <Text size="xs" tt="uppercase" fw={700} style={{ color: AZUL, letterSpacing: 1, marginBottom: 4 }}>
                                Data de Emissão
                            </Text>
                            <Text fw={600} style={{ color: "#000" }}>
                                {certificado.dataEmissao.toLocaleDateString("pt-BR")}
                            </Text>
                        </Box>

                        {certificado.dataValidade && (
                            <Box style={{ textAlign: "center" }}>
                                <Text size="xs" tt="uppercase" fw={700} style={{ color: AZUL, letterSpacing: 1, marginBottom: 4 }}>
                                    Válido Até
                                </Text>
                                <Text fw={600} style={{ color: "#000" }}>
                                    {certificado.dataValidade.toLocaleDateString("pt-BR")}
                                </Text>
                            </Box>
                        )}
                    </Group>

                    <div style={{ marginTop: "36px" }}>
                        <Text size="xs" tt="uppercase" fw={600} style={{ color: AZUL, letterSpacing: 1, marginBottom: 4 }}>
                            Código de Autenticidade
                        </Text>
                        <Text size="sm" fw={500} style={{ fontFamily: "monospace", letterSpacing: 2, color: "#000" }}>
                            {certificado.codigoAutenticacao}
                        </Text>
                    </div>
                </div>
            </div>
        </Container>

        <style>{`
            @media print {
                @page { margin: 0; size: landscape; }
                body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .print-hidden { display: none !important; }
            }
        `}</style>
    </div>
  );
}