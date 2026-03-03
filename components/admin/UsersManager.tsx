"use client";

import { useState } from "react";
import { 
  Table, Group, Text, Button, Badge, ActionIcon, Paper, Title, ScrollArea, Tooltip 
} from "@mantine/core";
import { IconEdit, IconTrash, IconPlus, IconUser } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import { deleteUserAction } from "@/app/admin/usuarios/actions";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  nome: string;
  username: string;
  email: string | null;
  role: "USER" | "INSTRUCTOR" | "ADMIN";
  ativo: boolean;
}

interface Props {
  users: User[];
  currentUserId: number;
}

export function UsersManager({ users, currentUserId }: Props) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const router = useRouter();

  const handleDelete = async (user: User) => {
    if (!confirm(`Tem certeza que deseja remover ${user.nome}? Se tiver registros, será apenas inativado.`)) {
        return;
    }

    setLoadingId(user.id);
    const res = await deleteUserAction(user.id);
    setLoadingId(null);

    if (res.success) {
        notifications.show({ 
            title: 'Sucesso', 
            message: res.message, 
            color: res.message.includes('INATIVADO') ? 'orange' : 'green' 
        });
    } else {
        notifications.show({ title: 'Erro', message: res.message, color: 'red' });
    }
  };

  const rows = users.map((u) => (
    <Table.Tr key={u.id}>
      <Table.Td>
        <Group gap="sm">
            <IconUser size={24} color="gray" />
            <div>
                <Text fw={500}>{u.nome}</Text>
                <Text size="xs" c="dimmed">{u.email || u.username}</Text>
            </div>
        </Group>
      </Table.Td>
      
      <Table.Td>
        <Badge 
            color={u.role === 'ADMIN' ? 'red' : u.role === 'INSTRUCTOR' ? 'orange' : 'blue'}
            variant="light"
        >
            {u.role}
        </Badge>
      </Table.Td>
      
      <Table.Td>
        <Badge 
            color={u.ativo ? 'green' : 'red'} 
            variant="filled" 
            size="sm"
        >
            {u.ativo ? 'ATIVO' : 'INATIVO'}
        </Badge>
      </Table.Td>
      
      <Table.Td>
        <Text size="sm">{u.username}</Text>
      </Table.Td>
      
      <Table.Td>
        <Group gap="xs" justify="flex-end">
            <Tooltip label="Editar">
                <ActionIcon 
                    variant="subtle" 
                    color="blue" 
                    component={Link} 
                    href={`/admin/usuarios/${u.id}/edit`}
                >
                    <IconEdit size={18} />
                </ActionIcon>
            </Tooltip>

            {u.id !== currentUserId && (
                <Tooltip label="Excluir / Inativar">
                    <ActionIcon 
                        variant="subtle" 
                        color="red" 
                        onClick={() => handleDelete(u)}
                        loading={loadingId === u.id}
                    >
                        <IconTrash size={18} />
                    </ActionIcon>
                </Tooltip>
            )}
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Paper withBorder p="md" radius="md">
        <Group justify="space-between" mb="md">
            <Title order={4}>Lista de Usuários</Title>
            <Button 
                leftSection={<IconPlus size={16} />} 
                component={Link} 
                href="/admin/usuarios/create"
            >
                Novo Usuário
            </Button>
        </Group>

        <ScrollArea>
            <Table striped highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Nome / Email</Table.Th>
                        <Table.Th>Perfil</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Usuário (Login)</Table.Th>
                        <Table.Th style={{ textAlign: 'right' }}>Ações</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>
        </ScrollArea>
    </Paper>
  );
}