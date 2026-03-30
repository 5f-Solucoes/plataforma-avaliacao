"use client";

import { useState } from "react";
import {
  Container, Paper, Title, Text, TextInput, Button, Stack, Group,
  ThemeIcon, Box, Badge, Alert, Center
} from "@mantine/core";
import {
  IconCertificate, IconSearch, IconCheck, IconX, IconArrowLeft
} from "@tabler/icons-react";
import { validarCertificadoAction } from "./actions";
import Link from "next/link";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CertificadoResult {
  nomeUsuario: string;
  nomeProva: string;
  fabricante: string | null;
  notaFinal: number | null;
  dataEmissao: string;
  dataValidade: string | null;
  codigoAutenticacao: string;
  valido: boolean;
}

// Página para validar um certificado usando o código de autenticação, exibindo informações do certificado e sua validade
export default function ValidarCertificadoPage() {
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<CertificadoResult | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const handleValidar = async () => {
    setError(null);
    setResultado(null);
    setInputError(null);

    const codigoTrimmed = codigo.trim();

    if (!codigoTrimmed) {
      setInputError("Informe o código do certificado.");
      return;
    }

    if (!UUID_REGEX.test(codigoTrimmed)) {
      setInputError("Formato inválido. Exemplo: 550e8400-e29b-41d4-a716-446655440000");
      return;
    }

    setLoading(true);

    try {
      const res = await validarCertificadoAction(codigoTrimmed);

      if (!res.success) {
        setError(res.message || "Certificado não encontrado.");
      } else {
        setResultado(res.certificado as CertificadoResult);
      }
    } catch {
      setError("Erro de comunicação com o servidor.");
    }

    setLoading(false);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Container size="sm" py="xl">
        <Group mb="xl">
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconArrowLeft size={16} />}
            component={Link}
            href="/"
          >
            Voltar
          </Button>
        </Group>

        <Center mb="xl">
          <Stack align="center" gap="xs">
            <ThemeIcon size={60} radius={60} variant="light" color="blue">
              <IconCertificate size={30} />
            </ThemeIcon>
            <Title order={2}>Validar Certificado</Title>
            <Text c="dimmed" size="sm" ta="center">
              Informe o código de autenticação para verificar a validade do certificado.
            </Text>
          </Stack>
        </Center>

        <Paper withBorder shadow="md" p="xl" radius="md">
          <Stack>
            <TextInput
              label="Código de Autenticação"
              placeholder="Ex: 550e8400-e29b-41d4-a716-446655440000"
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value);
                setInputError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleValidar()}
              error={inputError}
              styles={{
                input: { fontFamily: "monospace", letterSpacing: 1 },
              }}
            />

            <Button
              leftSection={<IconSearch size={16} />}
              onClick={handleValidar}
              loading={loading}
              fullWidth
            >
              Validar
            </Button>
          </Stack>
        </Paper>

        {error && (
          <Alert
            icon={<IconX size={16} />}
            title="Não encontrado"
            color="red"
            mt="xl"
            radius="md"
          >
            {error}
          </Alert>
        )}

        {resultado && (
          <Paper withBorder shadow="sm" p="xl" radius="md" mt="xl">
            <Stack align="center" gap="lg">
              <ThemeIcon
                size={50}
                radius={50}
                variant="light"
                color={resultado.valido ? "green" : "red"}
              >
                {resultado.valido ? (
                  <IconCheck size={26} />
                ) : (
                  <IconX size={26} />
                )}
              </ThemeIcon>

              <Badge
                size="lg"
                color={resultado.valido ? "green" : "red"}
                variant="light"
              >
                {resultado.valido ? "Certificado Válido" : "Certificado Expirado"}
              </Badge>

              <Title order={3} ta="center">
                {resultado.nomeUsuario}
              </Title>

              <Text size="lg" fw={500} c="blue" ta="center">
                {resultado.nomeProva}
              </Text>

              {resultado.fabricante && (
                <Text size="sm" c="dimmed">
                  {resultado.fabricante}
                </Text>
              )}

              <Group gap={50} mt="md" justify="center" wrap="wrap">
                <Box ta="center">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Data de Emissão
                  </Text>
                  <Text fw={600}>{formatDate(resultado.dataEmissao)}</Text>
                </Box>

                {resultado.notaFinal !== null && (
                  <Box ta="center">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Nota Final
                    </Text>
                    <Text fw={600}>{resultado.notaFinal.toFixed(1)} / 10.0</Text>
                  </Box>
                )}

                {resultado.dataValidade && (
                  <Box ta="center">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Válido Até
                    </Text>
                    <Text
                      fw={600}
                      c={resultado.valido ? "green" : "red"}
                    >
                      {formatDate(resultado.dataValidade)}
                    </Text>
                  </Box>
                )}
              </Group>

              <Box mt="md" ta="center">
                <Text size="xs" c="dimmed">Código de Autenticação</Text>
                <Text
                  size="sm"
                  style={{ fontFamily: "monospace", letterSpacing: 1 }}
                >
                  {resultado.codigoAutenticacao}
                </Text>
              </Box>
            </Stack>
          </Paper>
        )}
      </Container>
    </div>
  );
}
