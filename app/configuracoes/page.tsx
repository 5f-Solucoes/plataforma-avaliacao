import { MainLayout } from "@/components/MainLayout";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; 
import { Title, Container } from "@mantine/core";
import { redirect } from "next/navigation";
import { SettingsTabs } from "@/components/Settings/SettingsTabs";

// Página de configurações do usuário
export default async function ConfiguracoesPage() {
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    redirect("/login");
  }

  const user = await prisma.usuario.findUnique({
    where: { id: sessionUser.id },
    select: { nome: true, email: true } 
  });

  if (!user) redirect("/login");

  const userData = {
    nome: user.nome,
    email: user.email || ""
  };

  return (
    // @ts-ignore
    <MainLayout user={sessionUser}>
      <Container size="lg">
        <Title order={2} mb="xl">Configurações</Title>
        <SettingsTabs user={userData} />
      </Container>
    </MainLayout>
  );
}