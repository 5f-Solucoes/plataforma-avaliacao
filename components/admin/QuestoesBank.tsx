"use client";

import { useState } from "react";
import { 
  Paper, TextInput, Title, Badge, Group, Text, Accordion, ThemeIcon, 
  ScrollArea, Container, Select
} from "@mantine/core";
import { IconSearch, IconCheck, IconX, IconDatabase } from "@tabler/icons-react";

interface Resposta {
  id: number;
  textoAlternativa: string;
  ehCorreta: boolean;
}

interface Pergunta {
  id: number;
  enunciado: string;
  prova: {
    id: number;
    nome: string;
    fabricante: { nome: string } | null;
  };
  respostas: Resposta[];
}

interface Props {
  questoes: Pergunta[];
}

export function QuestoesBank({ questoes }: Props) {
  const [search, setSearch] = useState("");
  const [provaFilter, setProvaFilter] = useState<string | null>(null);

  const nomesProvas = Array.from(new Set(questoes.map(q => q.prova.nome)));

  const filtered = questoes.filter(q => {
    const matchText = q.enunciado.toLowerCase().includes(search.toLowerCase());
    const matchProva = provaFilter ? q.prova.nome === provaFilter : true;
    return matchText && matchProva;
  });

  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" mb="lg">
        <Group>
            <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                <IconDatabase size={20} />
            </ThemeIcon>
            <div>
                <Title order={4}>Banco de Questões</Title>
                <Text c="dimmed" size="sm">
                    {filtered.length} questões encontradas de {questoes.length} totais
                </Text>
            </div>
        </Group>
      </Group>

      <Group mb="xl" grow>
        <TextInput
            placeholder="Buscar pelo enunciado..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
        <Select 
            placeholder="Filtrar por Prova"
            data={nomesProvas}
            clearable
            searchable
            value={provaFilter}
            onChange={setProvaFilter}
        />
      </Group>

      <ScrollArea h={600} type="auto" offsetScrollbars>
        {filtered.length === 0 ? (
            <Text ta="center" c="dimmed" py="xl">Nenhuma questão encontrada com os filtros atuais.</Text>
        ) : (
            <Accordion variant="separated" radius="md">
            {filtered.map((q) => (
                <Accordion.Item key={q.id} value={q.id.toString()}>
                    <Accordion.Control>
                        <Group justify="space-between" mr="md">
                            <div style={{ flex: 1 }}>
                                <Text fw={500} lineClamp={1}>{q.enunciado}</Text>
                            </div>
                            <Group gap="xs">
                                <Badge color="gray" variant="light">
                                    {q.prova.fabricante?.nome || 'Geral'}
                                </Badge>
                                <Badge color="blue" variant="outline">
                                    {q.prova.nome}
                                </Badge>
                            </Group>
                        </Group>
                    </Accordion.Control>
                    
                    <Accordion.Panel>
                        <Container size="sm" px={0}>
                            <Text fw={700} mb="sm" c="dimmed">Enunciado Completo:</Text>
                            <Text mb="md">{q.enunciado}</Text>
                            
                            <Text fw={700} mb="sm" c="dimmed">Alternativas:</Text>
                            <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
                                {q.respostas.map((r, index) => (
                                    <Group 
                                        key={r.id} 
                                        p="sm" 
                                        bg={r.ehCorreta ? "green.1" : "transparent"} 
                                        style={{ 
                                            borderBottom: index < q.respostas.length - 1 ? '1px solid var(--mantine-color-default-border)' : 'none'
                                        }}
                                    >
                                        <ThemeIcon 
                                            color={r.ehCorreta ? "green" : "gray"} 
                                            variant={r.ehCorreta ? "filled" : "light"}
                                            size="sm"
                                            radius="xl"
                                        >
                                            {r.ehCorreta ? <IconCheck size={12}/> : <IconX size={12}/>}
                                        </ThemeIcon>
                                        
                                        <Text 
                                            size="sm" 
                                            c={r.ehCorreta ? "green.9" : "dimmed"}
                                            fw={r.ehCorreta ? 600 : 400}
                                        >
                                            {r.textoAlternativa}
                                        </Text>

                                        {r.ehCorreta && (
                                            <Badge size="xs" color="green" ml="auto">Correta</Badge>
                                        )}
                                    </Group>
                                ))}
                            </Paper>
                        </Container>
                    </Accordion.Panel>
                </Accordion.Item>
            ))}
            </Accordion>
        )}
      </ScrollArea>
    </Paper>
  );
}