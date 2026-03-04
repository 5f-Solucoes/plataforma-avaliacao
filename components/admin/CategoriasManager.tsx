"use client";

import { useState } from "react";
import { 
  Paper, Table, Group, ActionIcon, Tooltip, Text, Modal, TextInput, Title, Button, Badge
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconEdit, IconTrash, IconTags, IconInfoCircle } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { renameCategoriaAction, deleteCategoriaAction } from "@/app/admin/categorias/actions";

interface CategoriaAgrupada {
  categoria: string;
  _count: {
    id: number;
  };
}

interface Props {
  categorias: CategoriaAgrupada[];
}

export function CategoriasManager({ categorias }: Props) {
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  
  const [oldName, setOldName] = useState("");
  const [newName, setNewName] = useState("");

  const handleOpenEdit = (nomeAtual: string) => {
    setOldName(nomeAtual);
    setNewName(nomeAtual);
    open();
  };

  const handleDelete = async (categoryName: string, count: number) => {
    if (!confirm(`Tem certeza? Isso removerá a categoria "${categoryName}" de ${count} prova(s). As provas NÃO serão excluídas, apenas ficarão sem categoria.`)) {
      return;
    }

    const res = await deleteCategoriaAction(categoryName);
    if (res.success) {
      notifications.show({ title: 'Sucesso', message: res.message, color: 'green' });
    } else {
      notifications.show({ title: 'Erro', message: res.message, color: 'red' });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const res = await renameCategoriaAction(oldName, newName);
    
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
          <IconTags size={24} color="gray" />
          <Title order={4}>Gerenciar Categorias</Title>
        </Group>
      </Group>

      <Group mb="md">
          <IconInfoCircle size={16} color="gray" />
          <Text size="sm" c="dimmed">
              As categorias são geradas automaticamente com base no que é digitado no cadastro das provas. Para criar uma nova categoria, basta digitá-la ao criar uma nova prova.
          </Text>
      </Group>

      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nome da Categoria</Table.Th>
            <Table.Th>Provas Vinculadas</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Ações</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {categorias.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={3}>
                <Text c="dimmed" ta="center" py="md">Nenhuma categoria em uso no momento.</Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            categorias.map((c) => (
              <Table.Tr key={c.categoria}>
                <Table.Td fw={500}>{c.categoria}</Table.Td>
                <Table.Td>
                    <Badge color="blue" variant="light">
                        {c._count.id} prova(s)
                    </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end">
                    <Tooltip label="Renomear">
                      <ActionIcon variant="subtle" color="blue" onClick={() => handleOpenEdit(c.categoria)}>
                        <IconEdit size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Remover de todas as provas">
                      <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(c.categoria, c._count.id)}>
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
        title="Renomear Categoria"
        centered
      >
        <form onSubmit={handleSubmit}>
          <TextInput 
            label="Nome Atual" 
            value={oldName}
            disabled
            mb="md"
          />
          <TextInput 
            label="Novo Nome" 
            placeholder="Digite o novo nome da categoria" 
            value={newName}
            onChange={(e) => setNewName(e.currentTarget.value)}
            required
            mb="xl"
            data-autofocus
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>Cancelar</Button>
            <Button type="submit" loading={loading}>
              Salvar Alteração
            </Button>
          </Group>
        </form>
      </Modal>
    </Paper>
  );
}