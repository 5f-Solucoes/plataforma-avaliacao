"use client";

import { AppShell, Burger, Group, NavLink, Text, Title, Menu, Avatar, UnstyledButton, rem, Divider, ScrollArea } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { 
  IconDashboard, 
  IconUser, 
  IconLogout, 
  IconCertificate, 
  IconPencil, 
  IconSettings, 
  IconUsers,
  IconChevronDown
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions";

type UserRole = "USER" | "INSTRUCTOR" | "ADMIN";

interface MainLayoutProps {
  children: React.ReactNode;
  user?: {
    nome: string;
    role: UserRole;
  } | null;
}

export function MainLayout({ children, user }: MainLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logoutAction();
  };

  const isAdmin = user?.role === "ADMIN";
  const isInstructor = user?.role === "INSTRUCTOR" || isAdmin; 

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={3} style={{ fontWeight: 700 }}>Sistema de avaliação 5f</Title>
          </Group>

          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <UnstyledButton>
                <Group gap={7}>
                  <Avatar radius="xl" color="blue" size="md">
                    {user?.nome?.charAt(0).toUpperCase()}
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500} lh={1} mr={3}>
                      {user?.nome || "Usuário"}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {user?.role}
                    </Text>
                  </div>
                  <IconChevronDown style={{ width: rem(12), height: rem(12) }} stroke={1.5} />
                </Group>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item leftSection={<IconUser size={14} />} component={Link} href="/perfil">
                Meu Perfil
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red" leftSection={<IconLogout size={14} />} onClick={handleLogout}>
                Sair
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <ScrollArea>
            
            <NavLink
              component={Link}
              href="/dashboard"
              label="Home / Dashboard"
              leftSection={<IconDashboard size="1rem" />}
              active={pathname === "/dashboard"}
              variant="filled"
              color="blue"
              mb="md"
            />

            <Divider my="sm" />

            <Text size="xs" fw={500} c="dimmed" mb="xs" tt="uppercase">Área do Usuário</Text>
            <NavLink
              component={Link}
              href="/perfil"
              label="Meus Certificados"
              leftSection={<IconCertificate size="1rem" />}
              active={pathname === "/perfil"}
            />

            {isInstructor && (
              <>
                <Divider my="md" />
                <Text size="xs" fw={500} c="dimmed" mb="xs" tt="uppercase">Instrutor</Text>
                
                <NavLink
                  label="Gerenciar Provas"
                  leftSection={<IconPencil size="1rem" />}
                  defaultOpened={pathname.startsWith("/admin/provas")}
                >
                    <NavLink component={Link} href="/admin/provas" label="Cadastrar Provas" active={pathname === "/admin/provas"} />
                    <NavLink component={Link} href="/admin/questoes" label="Banco de Questões" />
                </NavLink>
              </>
            )}

            {isAdmin && (
              <>
                <Divider my="md" />
                <Text size="xs" fw={500} c="dimmed" mb="xs" tt="uppercase">Administração</Text>
                
                <NavLink component={Link} href="/admin/usuarios" label="Usuários" leftSection={<IconUsers size="1rem" />} />
                <NavLink component={Link} href="/configuracoes" label="Configurações" leftSection={<IconSettings size="1rem" />} />
              </>
            )}

        </ScrollArea>
      </AppShell.Navbar>

<AppShell.Main bg="body">{children}</AppShell.Main>    
    </AppShell>
  );
}