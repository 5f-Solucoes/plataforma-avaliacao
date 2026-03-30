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
  IconChevronDown,
  IconBuildingFactory,
  IconTags,
  IconBook
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

// Componente de layout principal que envolve todas as páginas, fornecendo uma estrutura consistente com header, navbar e área principal para o conteúdo
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
              <UnstyledButton p="xs" style={{ borderRadius: '8px' }}>
                <Group gap={10}>
                  <Avatar radius="xl" color="blue" size="md">
                    {user?.nome?.charAt(0).toUpperCase() || "U"}
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500} lh={1}>
                      {user?.nome || "Usuário"}
                    </Text>
                    <Text size="xs" c="dimmed" mt={2} tt="capitalize">
                      {user?.role ? user.role.toLowerCase() : "Sem cargo"}
                    </Text>
                  </div>
                  <IconChevronDown style={{ width: rem(14), height: rem(14) }} stroke={1.5} />
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
            <NavLink component={Link} href="/estudos" label="Estudos" leftSection={<IconBook size="1rem" />} />
            <NavLink component={Link} href="/configuracoes" label="Configurações" leftSection={<IconSettings size="1rem" />} />
            
            {isInstructor && (
              <>
                <Divider my="md" />
                <Text size="xs" fw={500} c="dimmed" mb="xs" tt="uppercase">Instrutor</Text>
                
                <NavLink
                  label="Gerenciar Provas"
                  leftSection={<IconPencil size="1rem" />}
                  defaultOpened={pathname.startsWith("/admin/provas") || pathname.startsWith("/admin/questoes")}
                >
                    <NavLink component={Link} href="/admin/provas" label="Gerenciar Provas" active={pathname === "/admin/provas"} />
                    <NavLink component={Link} href="/admin/questoes" label="Banco de Questões" active={pathname === "/admin/questoes"} />
                </NavLink>
                <NavLink component={Link} href="/admin/fabricantes" label="Fabricantes" leftSection={<IconBuildingFactory size="1rem" />} active={pathname === "/admin/fabricantes"} />
                <NavLink component={Link} href="/admin/categorias" label="Categorias" leftSection={<IconTags size="1rem" />} active={pathname === "/admin/categorias"} />
              </>
            )}

            {isAdmin && (
              <>
                <Divider my="md" />
                <Text size="xs" fw={500} c="dimmed" mb="xs" tt="uppercase">Administração</Text>
                
                <NavLink component={Link} href="/admin/usuarios" label="Usuários" leftSection={<IconUsers size="1rem" />} active={pathname === "/admin/usuarios"} />
              </>
            )}

        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main bg="body">{children}</AppShell.Main>    
    </AppShell>
  );
}