import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MainLayout } from "@/components/MainLayout";
import { 
  Card, 
  SimpleGrid, 
  Stack,      
  Group, 
  Text, 
  Title, 
  Paper, 
  Button, 
  Badge, 
  ThemeIcon, 
  Alert 
} from "@mantine/core";
import { IconDownload, IconTrophy } from "@tabler/icons-react";
import { redirect } from "next/navigation";

export default async function PerfilPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const rawCertificados = await prisma.certificado.findMany({
    where: { usuarioId: user.id },
    include: {
      tentativa: {
        include: { prova: { include: { fabricante: true } } }
      }
    },
    orderBy: { dataEmissao: 'desc' }
  });

  const certificados = rawCertificados.map((cert) => ({
    ...cert,
    tentativa: {
      ...cert.tentativa,
      notaFinal: cert.tentativa.notaFinal ? cert.tentativa.notaFinal.toNumber() : null,
      prova: {
        ...cert.tentativa.prova,
        notaCorte: cert.tentativa.prova.notaCorte.toNumber(),
      }
    }
  }));

  return (
    // @ts-ignore
    <MainLayout user={user}>
      <Title order={2} mb="lg">Meu Perfil</Title>

      {/* Usamos Stack para empilhar o Topo e a Lista verticalmente */}
      <Stack gap="xl">
        
        {/* SEÇÃO 1: Resumo do Usuário */}
        <Paper shadow="xs" p="xl" radius="md" withBorder>
            <Group>
                <ThemeIcon size={60} radius={60} color="blue" variant="light">
                    <Text size="xl" fw={700}>{user.nome.charAt(0)}</Text>
                </ThemeIcon>
                <div>
                    <Text size="xl" fw={700}>{user.nome}</Text>
                    <Text c="dimmed">{user.email || user.username}</Text>
                    <Badge mt="xs" color={user.role === 'ADMIN' ? 'red' : user.role === 'INSTRUCTOR' ? 'orange' : 'blue'}>
                        {user.role}
                    </Badge>
                </div>
            </Group>
        </Paper>

        {/* SEÇÃO 2: Lista de Certificados */}
        <div>
          <Title order={3} mb="md">Meus Certificados ({certificados.length})</Title>
          
          {certificados.length === 0 ? (
            <Alert icon={<IconTrophy />} color="gray" title="Sem conquistas ainda">
              Você ainda não concluiu nenhuma prova. Vá ao Dashboard para iniciar uma avaliação.
            </Alert>
          ) : (
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {certificados.map((cert) => (
                    <Card key={cert.id} shadow="sm" radius="md" padding="lg" withBorder>
                        <Group justify="space-between" align="flex-start" mb="xs">
                            <ThemeIcon size="lg" radius="md" color="yellow" variant="light">
                                <IconTrophy size={20} />
                            </ThemeIcon>
                            {cert.tentativa.prova.fabricante && (
                                <Badge variant="outline" color="gray">{cert.tentativa.prova.fabricante.nome}</Badge>
                            )}
                        </Group>
                        
                        <Text fw={700} size="lg" mt="xs">{cert.tentativa.prova.nome}</Text>
                        
                        <Group gap="xs" mt="md">
                            <Text size="xs" c="dimmed">Emitido em:</Text>
                            <Text size="xs" fw={500}>{cert.dataEmissao.toLocaleDateString()}</Text>
                        </Group>

                        <Group gap="xs">
                            <Text size="xs" c="dimmed">Código:</Text>
                            <Text size="xs" fw={500} style={{ fontFamily: 'monospace' }}>{cert.codigoAutenticacao}</Text>
                        </Group>

                        {cert.dataValidade && (
                            <Group gap="xs">
                                <Text size="xs" c="dimmed">Válido até:</Text>
                                <Text size="xs" fw={500} c="green">{cert.dataValidade.toLocaleDateString()}</Text>
                            </Group>
                        )}
                        
                        <Button 
                        variant="light" 
                        color="blue" 
                        fullWidth 
                        mt="md" 
                        leftSection={<IconDownload size={16}/>}
                        component="a" // Importante: usar 'a' ou Link
                        href={`/certificado/${cert.codigoAutenticacao}`} // Rota que criamos
                        target="_blank" // Abre em nova aba
                    >
                        Visualizar / Imprimir
                    </Button>
                    </Card>
                ))}
            </SimpleGrid>
          )}
        </div>
      </Stack>
    </MainLayout>
  );
}