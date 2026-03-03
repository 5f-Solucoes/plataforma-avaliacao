"use client";

import { useState } from "react";
import { 
  Table, ScrollArea, Group, Text, TextInput, Button, Badge, ActionIcon, 
  Modal, NumberInput, Select, Stack, Paper, Title 
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSearch, IconPlus, IconPower, IconCheck, IconList } from "@tabler/icons-react";
import { createProvaAction, toggleStatusProvaAction } from "@/app/admin/provas/actions";
import { notifications } from "@mantine/notifications"; 
import Link from "next/link";

interface Prova {
  id: number;
  nome: string;
  categoria: string | null;
  tempoLimiteMinutos: number;
  qtdPerguntasSorteio: number;
  notaCorte: number;
  validadeMeses: number; 
  fabricante: { id: number; nome: string } | null;
}

interface Fabricante {
  id: number;
  nome: string;
}

interface Props {
  provas: Prova[];
  fabricantes: Fabricante[];
}

export function ProvasManager({ provas, fabricantes }: Props) {
  const [search, setSearch] = useState("");
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);

  const filteredProvas = provas.filter((prova) => 
    prova.nome.toLowerCase().includes(search.toLowerCase()) ||
    (prova.fabricante?.nome || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const res = await createProvaAction(formData);
    
    setLoading(false);
    if (res.success) {
      close();
      notifications.show({
        title: 'Sucesso',
        message: 'Prova criada com sucesso!',
        color: 'green'
      });
    } else {
      notifications.show({
        title: 'Erro',
        message: res.message,
        color: 'red'
      });
    }
  };

  const handleToggle = async (id: number, validade: number) => {
    await toggleStatusProvaAction(id, validade);
    notifications.show({
        title: 'Atualizado',
        message: 'Status da prova alterado.',
        color: 'blue'
    });
  };

  const rows = filteredProvas.map((prova) => {
    const isAtivo = prova.validadeMeses > 0;
    
    return (
      <Table.Tr key={prova.id}>
        <Table.Td>{prova.id}</Table.Td>
        <Table.Td>
          <Text fw={500}>{prova.nome}</Text>
          <Text size="xs" c="dimmed">{prova.fabricante?.nome}</Text>
        </Table.Td>
        <Table.Td>
          <Badge color={prova.categoria === 'Cloud' ? 'blue' : 'gray'}>
            {prova.categoria || 'Geral'}
          </Badge>
        </Table.Td>
        <Table.Td>{prova.qtdPerguntasSorteio} qts / {prova.tempoLimiteMinutos} min</Table.Td>
        <Table.Td>{prova.notaCorte.toFixed(1)}</Table.Td>
        <Table.Td>
          <Badge color={isAtivo ? "green" : "red"} variant="light">
            {isAtivo ? "Ativo" : "Inativo"}
          </Badge>
        </Table.Td>
        <Table.Td>
          <Group gap={0} justify="flex-end">
             <ActionIcon 
                variant="subtle" 
                color={isAtivo ? "red" : "green"} 
                onClick={() => handleToggle(prova.id, prova.validadeMeses)}
             >
                {isAtivo ? <IconPower size={16} /> : <IconCheck size={16} />}
             </ActionIcon>
          </Group>
        </Table.Td>
        <Table.Td>
          <Group gap="xs" justify="flex-end">
             <ActionIcon 
                variant="subtle" 
                color="blue"
                component={Link}
                href={`/admin/provas/${prova.id}/questoes`}
                title="Gerenciar Questões"
             >
                <IconList size={16} />
             </ActionIcon>

          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Stack>
      <Group justify="space-between">
        <TextInput
          placeholder="Pesquisar..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          style={{ flex: 1, maxWidth: 400 }}
        />
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Nova Prova
        </Button>
      </Group>

      <Paper withBorder radius="md" p="md">
        <ScrollArea>
          <Table verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Prova / Fabricante</Table.Th>
                <Table.Th>Categoria</Table.Th>
                <Table.Th>Configuração</Table.Th>
                <Table.Th>Corte</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>

      <Modal opened={opened} onClose={close} title="Cadastrar Nova Prova">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput label="Nome" name="nome" required />
            
            <Select 
              label="Fabricante" 
              name="fabricanteId"
              data={fabricantes.map(f => ({ value: f.id.toString(), label: f.nome }))}
              required
              searchable
            />

            <TextInput label="Categoria" name="categoria" />

            <Group grow>
                <NumberInput label="Tempo (min)" name="tempoLimite" defaultValue={60} min={1} required />
                <NumberInput label="Qtd. Questões" name="qtdPerguntas" defaultValue={10} min={1} required />
            </Group>

            <Group grow>
                {/* CORREÇÃO AQUI: precision -> decimalScale */}
                <NumberInput 
                    label="Nota de Corte" 
                    name="notaCorte" 
                    defaultValue={7.0} 
                    decimalScale={1} 
                    fixedDecimalScale
                    step={0.5} 
                    max={10} 
                    required 
                />
                <NumberInput label="Validade (meses)" name="validadeMeses" defaultValue={12} min={0} />
            </Group>

            <Button type="submit" fullWidth mt="md" loading={loading}>
              Salvar
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}