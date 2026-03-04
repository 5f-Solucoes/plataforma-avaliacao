"use client";

import { 
  Container, 
  Title, 
  Text, 
  Button, 
  Group, 
  ThemeIcon, 
  SimpleGrid, 
  Paper 
} from "@mantine/core";
import { 
  IconArrowRight, 
  IconCertificate, 
  IconShieldCheck, 
  IconBrain 
} from "@tabler/icons-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{
      height: '100vh', 
      width: '100vw',
      display: 'flex',
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: 'var(--mantine-color-body)',
      position: 'relative',
      overflow: 'hidden', 
      padding: '1rem' 
    }}>
      
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '40vw',
        height: '40vw',
        borderRadius: '50%',
        background: 'var(--mantine-color-blue-light)',
        filter: 'blur(80px)',
        opacity: 0.5,
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-5%',
        width: '35vw',
        height: '35vw',
        borderRadius: '50%',
        background: 'var(--mantine-color-cyan-light)',
        filter: 'blur(80px)',
        opacity: 0.4,
        zIndex: 0
      }} />

      <Container size="lg" style={{ zIndex: 1, width: '100%' }}>
        <div style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
          
          <Badge mb="md">
            Bem-vindo
          </Badge>

          <Title
            order={1}
            style={{
              fontSize: 'clamp(2rem, 4vw, 3.5rem)', 
              fontWeight: 900,
              lineHeight: 1.15,
              marginBottom: '1rem',
            }}
          >
            Obtenha o seu certifcado<br />
            <Text component="span" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} inherit>
              Plataforma 5F
            </Text>
          </Title>

          <Text c="dimmed" size="lg" mb="xl" mx="auto" maw={600}>
            O ambiente para testes técnicos e emissão de certificados para colaboradores. 
            Valide suas habilidades e comprove seu conhecimento com segurança e agilidade.
          </Text>

          <Group justify="center">
            <Button
              component={Link}
              href="/login"
              size="lg"
              radius="xl"
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
              rightSection={<IconArrowRight size={20} />}
              style={{ boxShadow: '0 4px 15px rgba(34, 139, 230, 0.4)' }}
            >
              Acessar Minha Conta
            </Button>
          </Group>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mt="xl">
          <Paper withBorder radius="md" p="md" bg="body" style={{ zIndex: 2 }}>
            <ThemeIcon size="lg" radius="md" variant="light" color="blue" mb="sm">
              <IconBrain size={20} stroke={1.5} />
            </ThemeIcon>
            <Text fw={700} size="md" mb="xs">Avaliações Precisas</Text>
            <Text c="dimmed" size="sm" lh={1.4}>
              Provas dinâmicas e cronometradas, para testar seu conhecimento real.
            </Text>
          </Paper>

          <Paper withBorder radius="md" p="md" bg="body" style={{ zIndex: 2 }}>
            <ThemeIcon size="lg" radius="md" variant="light" color="cyan" mb="sm">
              <IconCertificate size={20} stroke={1.5} />
            </ThemeIcon>
            <Text fw={700} size="md" mb="xs">Certificação Imediata</Text>
            <Text c="dimmed" size="sm" lh={1.4}>
              Foi aprovado? Seu certificado em PDF com código único é gerado na mesma hora.
            </Text>
          </Paper>

          <Paper withBorder radius="md" p="md" bg="body" style={{ zIndex: 2 }}>
            <ThemeIcon size="lg" radius="md" variant="light" color="teal" mb="sm">
              <IconShieldCheck size={20} stroke={1.5} />
            </ThemeIcon>
            <Text fw={700} size="md" mb="xs">Ambiente Seguro</Text>
            <Text c="dimmed" size="sm" lh={1.4}>
              Plataforma robusta com controle de acesso, histórico de tentativas e criptografia.
            </Text>
          </Paper>
        </SimpleGrid>
      </Container>
    </div>
  );
}

function Badge({ children, mb }: any) {
  return (
    <div style={{ marginBottom: mb }}>
      <span style={{ 
        backgroundColor: 'var(--mantine-color-blue-light)', 
        color: 'var(--mantine-color-blue-text)', 
        padding: '6px 16px', 
        borderRadius: '50px', 
        fontSize: '13px', 
        fontWeight: 600 
      }}>
        {children}
      </span>
    </div>
  )
}