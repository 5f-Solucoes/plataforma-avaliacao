import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/MainLayout";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Title, SimpleGrid, Card, Text, Button, Group, Badge } from "@mantine/core";
import { IconBook2, IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";

export default async function EstudosIndexPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const query = user.role === "USER" 
    ? { usuariosPermitidos: { some: { id: user.id } } } 
    : {};

  const provas = await prisma.prova.findMany({
    where: query,
    include: {
      fabricante: true,
      _count: { select: { materiais: true } } 
    },
    orderBy: { nome: 'asc' }
  });

  return (
    // @ts-ignore
    <MainLayout user={user}>
      <Group mb="xl">
        <IconBook2 size={32} color="var(--mantine-color-blue-6)" />
        <Title order={2}>Módulo de Estudos</Title>
      </Group>

      {provas.length === 0 ? (
        <Text c="dimmed">Nenhuma prova disponível para estudo no momento.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {provas.map((prova) => (
            <Card key={prova.id} shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text fw={500}>{prova.nome}</Text>
                <Badge color="blue" variant="light">
                  {prova._count.materiais} materiais
                </Badge>
              </Group>

              <Text size="sm" c="dimmed" mb="md">
                {prova.fabricante?.nome || "Geral"} - {prova.categoria || "Sem Categoria"}
              </Text>

              <Link href={`/estudos/${prova.id}`} style={{ textDecoration: 'none' }}>
                <Button 
                  color="blue" 
                  fullWidth 
                  mt="md" 
                  radius="md"
                  rightSection={<IconArrowRight size={16} />}
                >
                  Acessar Material
                </Button>
              </Link>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </MainLayout>
  );
}