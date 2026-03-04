import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Paper, Text, Title, Container, ThemeIcon, Stack, Box, Group } from "@mantine/core"; 
import { IconCertificate } from "@tabler/icons-react";
import { CertificateControls } from "@/components/Certificado/CertificateControls"; 

interface PageProps {
  params: Promise<{ codigo: string }>;
}

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
    <div style={{ minHeight: '10vh', backgroundColor: '#f8f9fa' }}>
        <div className="print:hidden">
            <Container size="sm" py="sm">
                <CertificateControls
                nomeUsuario={certificado.usuario.nome}
                nomeProva={certificado.tentativa.prova.nome}
                dataEmissao={certificado.dataEmissao} />
            </Container>
        </div>

        <Container size="sm" py="xl">
            <Paper 
                id="certificado-content"
                p={40} 
                radius="sm" 
                shadow="xl" 
                withBorder 
                style={{ 
                    border: '5px double #228be6', 
                    textAlign: 'center',
                    minHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    backgroundColor: 'white'
                }}
            >
                <Stack align="center" gap="xl">
                    <ThemeIcon size={80} radius={80} variant="light">
                        <IconCertificate size={40} />
                    </ThemeIcon>

                    <Title order={1} size={30} style={{ textTransform: 'uppercase', letterSpacing: 2 }}>
                        Certificado de Conclusão
                    </Title>
                                 
                    <Title order={2} size={20} c="blue">
                        {certificado.usuario.nome}
                    </Title>
                    

                        <Title order={3}>{certificado.tentativa.prova.nome}</Title>
                        {certificado.tentativa.prova.fabricante && (
                            <Text c="dimmed">{certificado.tentativa.prova.fabricante.nome}</Text>
                        )}


                    <Group gap={50} mt="xl">
                        <Box>
                            <Text size="sm" c="dimmed" tt="uppercase">Data de Emissão</Text>
                            <Text fw={700}>{certificado.dataEmissao.toLocaleDateString()}</Text>
                        </Box>
                        <Box>
                            <Text size="sm" c="dimmed" tt="uppercase">Nota Final</Text>
                            <Text fw={700}>{certificado.tentativa.notaFinal?.toFixed(1)} / 10.0</Text>
                        </Box>
                        {certificado.dataValidade && (
                            <Box>
                                <Text size="sm" c="dimmed" tt="uppercase">Válido Até</Text>
                                <Text fw={700} c="green">{certificado.dataValidade.toLocaleDateString()}</Text>
                            </Box>
                        )}
                    </Group>

                    <Box mt={50}>
                        <Text size="xs" c="dimmed">Código de Autenticidade</Text>
                        <Text style={{ fontFamily: 'monospace', letterSpacing: 2 }}>
                            {certificado.codigoAutenticacao}
                        </Text>
                    </Box>
                    
                </Stack>
            </Paper>
        </Container>

        <style>{`
            @media print {
                @page { margin: 0; size: landscape; }
                body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .print\\:hidden { display: none !important; }
            }
        `}</style>
    </div>
  );
}