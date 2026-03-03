"use client";

import { useState, useEffect } from "react";
import { loginAction, checkMfaStatusAction } from "./action";
import { TextInput, PasswordInput, Button, Paper, Title, Container, Checkbox, Group, Alert, Loader, Text } from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaStatus, setMfaStatus] = useState<"idle" | "polling" | "success">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [transactionId, setTransactionId] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let pollCount = 0;
    const POLL_MAX = 60; 

    if (mfaStatus === "polling" && transactionId) {
      interval = setInterval(async () => {
        pollCount++;
        
        if (pollCount >= POLL_MAX) {
          clearInterval(interval);
          setMfaStatus("idle");
          setError("Tempo esgotado. Nenhuma resposta do push.");
          setLoading(false);
          return;
        }

        try {
            const result = await checkMfaStatusAction(transactionId);
            console.log("Polling:", result);

            if (result.status === "AUTHORIZED") {
                clearInterval(interval);
                setMfaStatus("success");
                setStatusMessage("Aprovado! Redirecionando...");
                router.push("/dashboard");
                router.refresh(); 
            } else if (result.status === "DENIED" || result.status === "ERROR") {
                clearInterval(interval);
                setMfaStatus("idle");
                setError("Autenticação foi negada ou falhou.");
                setLoading(false);
            }

        } catch (e) {
            console.error(e);
            clearInterval(interval);
            setError("Erro de rede ao verificar MFA.");
            setLoading(false);
        }
      }, 2000); 
    }

    return () => clearInterval(interval);
  }, [mfaStatus, transactionId, router]);

  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    
    setLoading(true);
    setError(null);
    setMfaStatus("idle");
    setStatusMessage("");

    const formData = new FormData(e.currentTarget);

    const result = await loginAction(null, formData);

    if (!result.success) {
      setError(result.message || "Erro ao tentar logar.");
      setLoading(false);
      return;
    }

    if (result.transactionId) {
      setTransactionId(result.transactionId);
      setStatusMessage("Push enviado! Verifique seu app AuthPoint.");
      setMfaStatus("polling");
    } else {
      setError("Resposta inesperada do servidor.");
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Login</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Utilize suas credenciais de rede
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        
        {error && (
            <Alert icon={<IconAlertCircle size="1rem" />} title="Erro" color="red" mb="md">
                {error}
            </Alert>
        )}

        {mfaStatus !== "idle" && (
            <Alert 
                icon={mfaStatus === "success" ? <IconCheck size="1rem"/> : <Loader size="xs" />} 
                title="Autenticação MFA" 
                color={mfaStatus === "success" ? "green" : "blue"} 
                mb="md"
            >
                {statusMessage}
            </Alert>
        )}

        <form onSubmit={onFormSubmit}>
          <TextInput 
            label="Usuário ou E-mail" 
            placeholder="usuario" 
            name="login_identifier" 
            required 
            readOnly={loading} 
          />
          <PasswordInput 
            label="Senha" 
            placeholder="Sua senha" 
            name="senha" 
            required 
            mt="md" 
            readOnly={loading}
          />
          
          <Group justify="space-between" mt="lg">
            <Checkbox label="Relembre-me" name="remember" />
          </Group>

          <Button fullWidth mt="xl" type="submit" loading={loading}>
            Entrar
          </Button>
        </form>
      </Paper>
    </Container>
  );
}