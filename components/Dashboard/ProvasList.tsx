"use client";

import { SimpleGrid, Card, Image, Text, Group, Badge, Button } from "@mantine/core";
import { IconClock, IconListCheck, IconCertificate } from "@tabler/icons-react";
import Link from "next/link";

interface ProvaItem {
  id: number;
  nome: string;
  categoria: string | null;
  tempoLimiteMinutos: number;
  qtdPerguntasSorteio: number;
  notaCorte: number;
  fabricante: { nome: string } | null;
}

interface Props {
  provas: ProvaItem[];
  concluidasIds?: number[];
}

export function ProvasList({ provas, concluidasIds = [] }: Props) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
      {provas.map((prova) => {
        const jaConcluiu = concluidasIds.includes(prova.id);

        return (
          <Card key={prova.id} shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mt="md" mb="xs">
              <Text fw={500}>{prova.nome}</Text>
              {jaConcluiu ? (
                <Badge color="green" variant="light">Certificado Ativo</Badge>
              ) : (
                <Badge color="pink" variant="light">
                   {prova.fabricante?.nome || "Geral"}
                </Badge>
              )}
            </Group>

            <Text size="sm" c="dimmed">
              Categoria: {prova.categoria || "Geral"}
            </Text>

            <Group mt="md" gap="xs">
                <Badge leftSection={<IconClock size={12}/>} variant="outline" color="gray">
                    {prova.tempoLimiteMinutos} min
                </Badge>
                <Badge leftSection={<IconListCheck size={12}/>} variant="outline" color="gray">
                    {prova.qtdPerguntasSorteio} questões
                </Badge>
            </Group>

            {jaConcluiu ? (
               <Button 
                 variant="light" 
                 color="green" 
                 fullWidth 
                 mt="md" 
                 radius="md"
                 leftSection={<IconCertificate size={16} />}
                 component={Link}
                 href="/perfil" 
               >
                 Ver Certificado
               </Button>
            ) : (
               <Button 
                 variant="light" 
                 color="blue" 
                 fullWidth 
                 mt="md" 
                 radius="md"
                 component={Link}
                 href={`/prova/${prova.id}`}
               >
                 Iniciar Avaliação
               </Button>
            )}
          </Card>
        );
      })}
    </SimpleGrid>
  );
}