"use client";

import { useState } from "react";
import { 
  Paper, TextInput, Select, Button, Group, Title, Grid, LoadingOverlay, Alert 
} from "@mantine/core";
import { IconDeviceFloppy, IconInfoCircle } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";
import { createUserAction, updateUserAction } from "@/app/admin/usuarios/actions";

interface UserData {
  id?: number;
  nome: string;
  username: string;
  email: string | null;
  role: string;
  ativo: boolean;
}

interface Props {
  initialData?: UserData; 
}

// Componente para criar ou editar um usuário, com campos para nome, username, email, perfil de acesso e status, e feedback visual para o usuário sobre o resultado da operação
export function UserForm({ initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    let res;
    
    if (initialData?.id) {
        res = await updateUserAction(initialData.id, formData);
    } else {
        res = await createUserAction(formData);
    }

    setLoading(false);

    if (res.success) {
        notifications.show({ title: 'Sucesso', message: res.message, color: 'green' });
        router.push("/admin/usuarios");
    } else {
        notifications.show({ title: 'Erro', message: res.message, color: 'red' });
    }
  };

  return (
    <Paper withBorder p="xl" radius="md" pos="relative">
      <LoadingOverlay visible={loading} />
      
      <Group justify="space-between" mb="lg">
          <Title order={3}>
            {initialData ? `Editar: ${initialData.nome}` : "Cadastrar Novo Usuário"}
          </Title>
      </Group>

      {!initialData && (
        <Alert icon={<IconInfoCircle size={16}/>} title="Senha Padrão" color="blue" mb="lg">
            O novo usuário será criado com a senha: <strong>mudar123</strong>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput 
                    label="Nome Completo" 
                    name="nome"
                    defaultValue={initialData?.nome}
                    required 
                />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput 
                    label="Usuário (Login WatchGuard)" 
                    name="username"
                    defaultValue={initialData?.username}
                    placeholder="Ex: jsilva"
                    required 
                />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput 
                    label="E-mail" 
                    name="email"
                    type="email"
                    defaultValue={initialData?.email || ""}
                    required 
                />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                    label="Perfil de Acesso"
                    name="role"
                    defaultValue={initialData?.role || "USER"}
                    data={[
                        { value: 'USER', label: 'Colaborador' },
                        { value: 'INSTRUCTOR', label: 'Instrutor' },
                        { value: 'ADMIN', label: 'Administrador' },
                    ]}
                    required
                    allowDeselect={false}
                />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                    label="Status"
                    name="status"
                    defaultValue={initialData ? (initialData.ativo ? "ATIVO" : "INATIVO") : "ATIVO"}
                    data={[
                        { value: 'ATIVO', label: 'Ativo' },
                        { value: 'INATIVO', label: 'Inativo' },
                    ]}
                    required
                    allowDeselect={false}
                />
            </Grid.Col>
        </Grid>

        <Group justify="flex-end" mt="xl">
            <Button variant="default" component={Link} href="/admin/usuarios">
                Cancelar
            </Button>
            <Button type="submit" leftSection={<IconDeviceFloppy size={18}/>} loading={loading}>
                {initialData ? "Salvar Alterações" : "Criar Usuário"}
            </Button>
        </Group>
      </form>
    </Paper>
  );
}