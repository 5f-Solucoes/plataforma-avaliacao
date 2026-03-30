"use client";

import { useState } from "react";
import { 
  Tabs, Paper, TextInput, PasswordInput, Button, Group, Title, 
  Text, Switch, useMantineColorScheme, useMantineTheme, useComputedColorScheme, Alert 
} from "@mantine/core";
import { 
  IconUser, IconLock, IconMoon, IconSun, IconDeviceFloppy, IconInfoCircle 
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { updateProfileAction, changePasswordAction } from "@/app/configuracoes/actions";

interface User {
  nome: string;
  email: string;
}

// Componente de abas para configurações do usuário, incluindo edição de perfil e preferências de aparência
export function SettingsTabs({ user }: { user: User }) {
  const { colorScheme, toggleColorScheme, setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';
  const theme = useMantineTheme();
  const [loading, setLoading] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateProfileAction(formData);
    setLoading(false);

    if (res.success) {
      notifications.show({ title: 'Sucesso', message: res.message, color: 'green' });
    } else {
      notifications.show({ title: 'Erro', message: res.message, color: 'red' });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await changePasswordAction(formData);
    setLoading(false);

    if (res.success) {
      notifications.show({ title: 'Sucesso', message: res.message, color: 'green' });
      (e.target as HTMLFormElement).reset(); 
    } else {
      notifications.show({ title: 'Erro', message: res.message, color: 'red' });
    }
  };

  return (
    <Tabs defaultValue="perfil" radius="md">
      <Tabs.List>
        <Tabs.Tab value="perfil" leftSection={<IconUser size={16} />}>
          Meu Perfil
        </Tabs.Tab>
        <Tabs.Tab value="aparencia" leftSection={colorScheme === 'dark' ? <IconMoon size={16}/> : <IconSun size={16}/>}>
          Aparência
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="perfil" pt="xl">
        <Paper withBorder p="xl" radius="md">
            <Title order={4} mb="md">Dados Pessoais</Title>
            <form onSubmit={handleProfileSubmit}>
                <Group grow>
                    <TextInput 
                        label="Nome Completo" 
                        name="nome" 
                        defaultValue={user.nome} 
                        required 
                    />
                </Group>
                <Group justify="flex-end" mt="xl">
                    <Button type="submit" loading={loading} leftSection={<IconDeviceFloppy size={18}/>}>
                        Salvar Alterações
                    </Button>
                </Group>
            </form>
        </Paper>
      </Tabs.Panel>

      <Tabs.Panel value="aparencia" pt="xl">
        <Paper withBorder p="xl" radius="md">
            <Title order={4} mb="md">Preferências de Visualização</Title>
            
            <Group justify="space-between" align="center">
                <div>
                    <Text fw={500}>Modo Escuro</Text>
                    <Text c="dimmed" size="sm">
                        Altera o tema para cores escuras e reduz o brilho.
                    </Text>
                </div>
                <Switch 
                    size="lg" 
                    onLabel={<IconMoon size={16} />}
                    offLabel={<IconSun size={16} />}
                    checked={isDark}
                    onChange={() => toggleColorScheme()}
                />
            </Group>
        </Paper>
      </Tabs.Panel>
    </Tabs>
  );
}