"use client";

import { useState, useEffect } from "react";
import { 
  Paper, Title, Text, Radio, Button, Stack, Group, Container, 
  Progress, ThemeIcon, Center, Box, Image
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { finalizarProva } from "@/app/prova/[id]/actions";
import { IconClock, IconAlertTriangle, IconCheck, IconX, IconRefresh, IconTrophy } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export function ExamRunner({ tentativa, tempoLimiteMinutos }: any) {
  const router = useRouter();
  
  const calcularTempoRestante = () => {
    const inicio = new Date(tentativa.dataInicio).getTime();
    const agora = Date.now();
    const limiteEmMs = tempoLimiteMinutos * 60 * 1000;
    const passado = agora - inicio;
    const restante = Math.floor((limiteEmMs - passado) / 1000);
    return Math.max(0, restante);
  };

  const [timeLeft, setTimeLeft] = useState(calcularTempoRestante());
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ aprovado: boolean, nota: number, notaCorte: number } | null>(null);

  useEffect(() => {
    const initialRespostas: Record<number, number> = {};
    tentativa.respostas.forEach((tr: any) => {
      if (tr.respostaEscolhidaId) {
        initialRespostas[tr.pergunta.id] = tr.respostaEscolhidaId;
      }
    });
    setRespostas(initialRespostas);
  }, [tentativa]);

  useEffect(() => {
    if (resultado) return; 

    const timer = setInterval(() => {
      const restante = calcularTempoRestante();
      setTimeLeft(restante);
      
      if (restante <= 0) {
        clearInterval(timer);
        handleFinalizar(true); 
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [resultado]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalPerguntas = tentativa.respostas.length;
  const totalRespondidas = Object.keys(respostas).length;
  const porcentagem = (totalRespondidas / totalPerguntas) * 100;
  const isTimeCritical = timeLeft < 60; 

  const handleSelect = (perguntaId: number, respostaId: string) => {
    setRespostas(prev => ({
        ...prev,
        [perguntaId]: parseInt(respostaId)
    }));
  };

  const handleFinalizar = async (autoSubmit = false) => {
    if (!autoSubmit && totalRespondidas < totalPerguntas) {
        if(!confirm(`Atenção: Você respondeu apenas ${totalRespondidas} de ${totalPerguntas} questões. Deseja finalizar mesmo assim?`)) return;
    } else if (!autoSubmit) {
        if(!confirm("Tem certeza que deseja finalizar a prova? O resultado será gerado agora.")) return;
    }

    setLoading(true);
    
    try {
        const res = await finalizarProva(tentativa.prova.id, respostas);
        setLoading(false);
        
        if (res?.success) {
            setResultado({
                aprovado: res.aprovado ?? false,
                nota: res.nota ?? 0,
                notaCorte: res.notaCorte ?? 0
            });
        } else {
            notifications.show({ color: 'red', message: res.message || "Erro ao processar correção." });
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
                    {resultado.aprovado ? "Parabéns, você foi aprovado!" : "Não foi dessa vez"}
                </Title>

                <Text size="lg" c="dimmed" mb="xl">
                    {resultado.aprovado 
                        ? "Você atingiu a nota necessária e seu certificado já foi emitido." 
                        : "Você não atingiu a nota mínima para aprovação nesta tentativa."}
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
                        onClick={() => router.push('/dashboard')} 
                    >
                        Voltar ao Dashboard
                    </Button>
                )}
            </Paper>
        </Container>
    );
  }

  return (
    <Container size="md" pb={100}>
      <Paper pos="sticky" top={60} style={{ zIndex: 10 }} shadow="sm" p="md" radius="md" withBorder mb="xl" >
        <Group justify="space-between">
            <div>
                <Text fw={700} size="lg">{tentativa.prova.nome}</Text>
                <Group gap="xs">
                    <Text size="sm" c="dimmed">{totalRespondidas} de {totalPerguntas} respondidas</Text>
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
        {tentativa.respostas.map((tr: any, index: number) => (
            <Paper key={tr.id} p="lg" shadow="xs" radius="md" withBorder>
                <Group mb="md" align="flex-start">
                    <ThemeIcon size={28} radius="xl" color={respostas[tr.pergunta.id] ? "blue" : "gray"}>
                        <Text fw={700} size="sm">{index + 1}</Text>
                    </ThemeIcon>
                    <Text fw={600} size="lg" style={{ flex: 1 }}>
                        {tr.pergunta.enunciado}
                    </Text>
                </Group>

                {tr.pergunta.imagemUrl && (
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <Image 
                            src={tr.pergunta.imagemUrl} 
                            alt={`Imagem da questão ${index + 1}`} 
                            radius="md"
                            style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', display: 'inline-block' }}
                        />
                    </div>
                )}

                <Radio.Group 
                    value={respostas[tr.pergunta.id]?.toString()} 
                    onChange={(val) => handleSelect(tr.pergunta.id, val)}
                >
                    <Stack gap="sm">
                        {tr.pergunta.respostas.map((r: any) => (
                            <Paper 
                                key={r.id} 
                                withBorder 
                                p="sm" 
                                radius="md" 
                                bg={respostas[tr.pergunta.id] === r.id ? "blue.0" : "transparent"}
                                style={{ borderColor: respostas[tr.pergunta.id] === r.id ? "var(--mantine-color-blue-5)" : undefined }}
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

      <Box mt="xl" pt="xl" pb="xl" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
        <Button 
            size="lg" 
            fullWidth 
            color={totalRespondidas < totalPerguntas ? "orange" : "green"} 
            onClick={() => handleFinalizar(false)} 
            loading={loading}
            leftSection={totalRespondidas < totalPerguntas ? <IconAlertTriangle /> : <IconCheck />}
        >
            {totalRespondidas < totalPerguntas 
                ? `Finalizar (Faltam ${totalPerguntas - totalRespondidas})` 
                : "FINALIZAR AVALIAÇÃO"}
        </Button>
      </Box>
    </Container>
  );
}