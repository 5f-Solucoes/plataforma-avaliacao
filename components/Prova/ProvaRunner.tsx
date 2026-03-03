"use client";

import { useState, useEffect } from "react";
import { 
  Paper, Title, Text, Radio, Button, Stack, Group, Container, 
  Progress, ThemeIcon, Center, Box 
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { submitProvaAction } from "@/app/prova/actions";
import { IconClock, IconAlertTriangle, IconCheck, IconX, IconRefresh, IconTrophy } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

interface RespostaView {
  id: number;
  textoAlternativa: string;
}

interface PerguntaView {
  id: number;
  enunciado: string;
  respostas: RespostaView[];
}

interface Props {
  prova: {
    id: number;
    nome: string;
    tempoLimiteMinutos: number;
  };
  perguntas: PerguntaView[];
}

export function ProvaRunner({ prova, perguntas }: Props) {
  const router = useRouter();
  
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(prova.tempoLimiteMinutos * 60); 
  
  const [resultado, setResultado] = useState<{aprovado: boolean, nota: number, notaCorte: number} | null>(null);

  useEffect(() => {
    if (resultado) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resultado]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalRespondidas = Object.keys(respostas).length;
  const porcentagem = (totalRespondidas / perguntas.length) * 100;
  const isTimeCritical = timeLeft < 60; 

  const handleSelect = (perguntaId: number, respostaId: string) => {
    setRespostas(prev => ({
        ...prev,
        [perguntaId]: parseInt(respostaId)
    }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && totalRespondidas < perguntas.length) {
        if(!confirm(`Atenção: Você respondeu apenas ${totalRespondidas} de ${perguntas.length} questões. Deseja finalizar mesmo assim?`)) return;
    } else if (!autoSubmit) {
        if(!confirm("Tem certeza que deseja finalizar a prova?")) return;
    }

    setLoading(true);
    
    try {
        const res = await submitProvaAction(prova.id, respostas);
        setLoading(false);
        
        if (res?.success) {
            setResultado({
                aprovado: res.aprovado ?? false,
                nota: res.nota ?? 0,
                notaCorte: res.notaCorte ?? 0
            });

            if (res.aprovado) {
                setTimeout(() => {
                    router.push('/perfil');
                }, 4000);
            }
        } else {
            notifications.show({ color: 'red', message: res.message || "Erro ao enviar." });
        }
    } catch (error) {
        setLoading(false);
        notifications.show({ color: 'red', message: "Erro de comunicação." });
    }
  };

  if (resultado) {
    return (
        <Container size="sm" py={50}>
            <Paper shadow="md" radius="lg" p={40} withBorder ta="center">
                <Center mb="xl">
                    <ThemeIcon 
                        size={80} 
                        radius={80} 
                        color={resultado.aprovado ? "green" : "red"}
                        variant="light"
                    >
                        {resultado.aprovado ? <IconTrophy size={40} /> : <IconX size={40} />}
                    </ThemeIcon>
                </Center>

                <Title order={1} mb="md">
                    {resultado.aprovado ? "Parabéns!" : "Não foi dessa vez"}
                </Title>

                <Text size="lg" c="dimmed" mb="xl">
                    {resultado.aprovado 
                        ? "Você atingiu a nota necessária e seu certificado já foi emitido." 
                        : "Você não atingiu a nota mínima para aprovação."}
                </Text>

                <Group justify="center" gap="xl" mb={30}>
                    <Box>
                        <Text size="sm" tt="uppercase" fw={700} c="dimmed">Sua Nota</Text>
                        <Text size="xl" fw={900} c={resultado.aprovado ? "green" : "red"}>
                            {resultado.nota.toFixed(1)}
                        </Text>
                    </Box>
                    <Box>
                        <Text size="sm" tt="uppercase" fw={700} c="dimmed">Nota de Corte</Text>
                        <Text size="xl" fw={900}>
                            {resultado.notaCorte.toFixed(1)}
                        </Text>
                    </Box>
                </Group>

                {resultado.aprovado ? (
                    <Button size="lg" color="green" onClick={() => router.push('/perfil')}>
                        Ver meu Certificado
                    </Button>
                ) : (
                    <Button 
                        size="lg" 
                        color="blue" 
                        leftSection={<IconRefresh size={20}/>}
                        onClick={() => window.location.reload()} 
                    >
                        Tentar Novamente
                    </Button>
                )}
            </Paper>
        </Container>
    );
  }

  return (
    <Container size="md" pb={100}>
      <Paper 
        pos="sticky" 
        top={60} 
        style={{ zIndex: 10 }}
        shadow="sm" 
        p="md" 
        radius="md" 
        withBorder 
        mb="xl"
        bg="white"
      >
        <Group justify="space-between">
            <div>
                <Text fw={700} size="lg">{prova.nome}</Text>
                <Group gap="xs">
                    <Text size="sm" c="dimmed">{totalRespondidas} de {perguntas.length} respondidas</Text>
                </Group>
            </div>
            
            <Group>
                <ThemeIcon variant="light" color={isTimeCritical ? "red" : "blue"} size="lg">
                    <IconClock size={20} />
                </ThemeIcon>
                <Text fw={700} size="xl" c={isTimeCritical ? "red" : "dark"} style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatTime(timeLeft)}
                </Text>
            </Group>
        </Group>
        
        <Progress 
            value={porcentagem} 
            mt="sm" 
            size="md" 
            radius="xl" 
            color={porcentagem === 100 ? "green" : "blue"}
            striped={loading}
            animated={loading}
        />
      </Paper>

      <Stack gap="xl">
        {perguntas.map((p, index) => (
            <Paper key={p.id} p="lg" shadow="xs" radius="md" withBorder>
                <Group mb="md" align="flex-start">
                    <ThemeIcon size={28} radius="xl" color={respostas[p.id] ? "blue" : "gray"}>
                        <Text fw={700} size="sm">{index + 1}</Text>
                    </ThemeIcon>
                    <Text fw={600} size="lg" style={{ flex: 1 }}>
                        {p.enunciado}
                    </Text>
                </Group>

                <Radio.Group 
                    value={respostas[p.id]?.toString()} 
                    onChange={(val) => handleSelect(p.id, val)}
                >
                    <Stack gap="sm">
                        {p.respostas.map((r) => (
                            <Paper 
                                key={r.id} 
                                withBorder 
                                p="sm" 
                                radius="md" 
                                bg={respostas[p.id] === r.id ? "blue.0" : "transparent"}
                                style={{ borderColor: respostas[p.id] === r.id ? "var(--mantine-color-blue-5)" : undefined }}
                            >
                                <Radio 
                                    value={r.id.toString()} 
                                    label={<Text size="md">{r.textoAlternativa}</Text>}
                                    style={{ cursor: 'pointer' }}
                                />
                            </Paper>
                        ))}
                    </Stack>
                </Radio.Group>
            </Paper>
        ))}
      </Stack>

      <Paper 
        pos="fixed" 
        bottom={0} 
        left={0} 
        right={0} 
        p="md" 
        bg="white" 
        style={{ borderTop: '1px solid #eee', zIndex: 10 }}
      >
        <Container size="md">
            <Button 
                size="lg" 
                fullWidth 
                color={totalRespondidas < perguntas.length ? "orange" : "green"} 
                onClick={() => handleSubmit(false)} 
                loading={loading}
                leftSection={totalRespondidas < perguntas.length ? <IconAlertTriangle /> : <IconCheck />}
            >
                {totalRespondidas < perguntas.length 
                    ? `Finalizar (Faltam ${perguntas.length - totalRespondidas})` 
                    : "FINALIZAR AVALIAÇÃO"}
            </Button>
        </Container>
      </Paper>
    </Container>
  );
}