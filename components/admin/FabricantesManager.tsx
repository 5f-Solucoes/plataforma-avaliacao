"use client";

import { useState } from "react";
import { 
  Paper, Table, Group, Button, ActionIcon, Tooltip, Text, Modal, TextInput, Title
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconEdit, IconTrash, IconBuildingFactory } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { saveFabricanteAction, deleteFabricanteAction } from "@/app/admin/fabricantes/actions";

interface Fabricante {
  id: number;
  nome: string;
  site: string | null;
  areaAtuacao: string | null;
}

interface Props {
  fabricantes: Fabricante[];
}

export function FabricantesManager({ fabricantes }: Props) {
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [nome, setNome] = useState("");
  const [site, setSite] = useState("");
  const [areaAtuacao, setAreaAtuacao] = useState("");

  const handleOpenCreate = () => {
    setEditingId(null);
    setNome("");
    setSite("");
    setAreaAtuacao("");
    open();
  };

  const handleOpenEdit = (f: Fabricante) => {
    setEditingId(f.id);
    setNome(f.nome);
    setSite(f.site || "");
    setAreaAtuacao(f.areaAtuacao || "");
    open();
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Deseja realmente excluir o fabricante ${nome}?`)) return;

    const res = await deleteFabricanteAction(id);
    if (res.success) {
      notifications.show({ title: 'Sucesso', message: res.message, color: 'green' });
    } else {
      notifications.show({ title: 'Erro', message: res.message, color: 'red' });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("site", site);
    formData.append("areaAtuacao", areaAtuacao);

    const res = await saveFabricanteAction(editingId, formData);
    
    setLoading(false);

    if (res.success) {
      notifications.show({ title: 'Sucesso', message: res.message, color: 'green' });
      close();
    } else {
      notifications.show({ title: 'Erro', message: res.message, color: 'red' });
    }
  };

  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" mb="lg">
        <Group>
          <IconBuildingFactory size={24} color="gray" />
          <Title order={4}>Fabricantes e Tecnologias</Title>
        </Group>
        <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
          Novo Fabricante
        </Button>
      </Group>

      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>Nome</Table.Th>
            <Table.Th>Área de Atuação</Table.Th>
            <Table.Th>Site</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Ações</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {fabricantes.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text c="dimmed" ta="center" py="md">Nenhum fabricante cadastrado.</Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            fabricantes.map((f) => (
              <Table.Tr key={f.id}>
                <Table.Td><Text size="sm" c="dimmed">#{f.id}</Text></Table.Td>
                <Table.Td fw={500}>{f.nome}</Table.Td>
                <Table.Td>{f.areaAtuacao || "-"}</Table.Td>
                <Table.Td>
                  {f.site ? (
                    <Text component="a" href={f.site.startsWith('http') ? f.site : `https://${f.site}`} target="_blank" c="blue" size="sm">
                      {f.site}
                    </Text>
                  ) : "-"}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end">
                    <Tooltip label="Editar">
                      <ActionIcon variant="subtle" color="blue" onClick={() => handleOpenEdit(f)}>
                        <IconEdit size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Excluir">
                      <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(f.id, f.nome)}>
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      <Modal 
        opened={opened} 
        onClose={close} 
        title={editingId ? "Editar Fabricante" : "Novo Fabricante"}
        centered
      >
        <form onSubmit={handleSubmit}>
          <TextInput 
            label="Nome do Fabricante" 
            placeholder="Ex: AWS, Microsoft, Cisco" 
            value={nome}
            onChange={(e) => setNome(e.currentTarget.value)}
            required
            mb="md"
          />
          <TextInput 
            label="Área de Atuação" 
            placeholder="Ex: Cloud Computing, Redes, Segurança" 
            value={areaAtuacao}
            onChange={(e) => setAreaAtuacao(e.currentTarget.value)}
            mb="md"
          />
          <TextInput 
            label="Site Oficial" 
            placeholder="Ex: https://aws.amazon.com" 
            value={site}
            onChange={(e) => setSite(e.currentTarget.value)}
            mb="xl"
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>Cancelar</Button>
            <Button type="submit" loading={loading}>
              {editingId ? "Salvar" : "Cadastrar"}
            </Button>
          </Group>
        </form>
      </Modal>
    </Paper>
  );
}