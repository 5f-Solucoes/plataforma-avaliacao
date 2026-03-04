"use client";

import { useState, useEffect } from "react";
import { 
  Paper, Title, Text, Radio, Group, Button, Container, Stack, Progress, Alert, Image 
} from "@mantine/core";
import { IconClock, IconAlertCircle } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { salvarRespostaParcial, finalizarProva } from "@/app/prova/[id]/actions";

export function ExamRunner({ tentativa, tempoLimiteMinutos }: any) {
  const router = useRouter();
  
  const calcularTempoRestante = () => {
    const inicio = new Date(tentativa.dataInicio).getTime();
    const agora = new Date().getTime();
    const limiteEmMs = tempoLimiteMinutos * 60 * 1000;
    const tempoPassado = agora - inicio;
    const restante = Math.max(0, Math.floor((limiteEmMs - tempoPassado) / 1000));
    return restante;
  };

  const [tempoRestanteSegundos, setTempoRestanteSegundos] = useState(calcularTempoRestante());
  const [loadingFim, setLoadingFim] = useState(false);
  const [finalizado, setFinalizado] = useState(false);

  const [respostas, setRespostas] = useState<Record<number, number>>(() => {
    const initialState: Record<number, number> = {};
    tentativa.respostas.forEach((tr: any) => {
      if (tr.respostaEscolhidaId) {
        initialState[tr.id] = tr.respostaEscolhidaId;
      }
    });
    return initialState;
  });

  useEffect(() => {
    if (finalizado) return;

    const timer = setInterval(() => {
      const restante = calcularTempoRestante();
      setTempoRestanteSegundos(restante);

      if (restante <= 0) {
        clearInterval(timer);
        handleFinalizar(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [finalizado]);

  const handleSelectAlternativa = async (tentativaRespostaId: number, respostaId: number) => {
    if (finalizado) return;

    setRespostas(prev => ({ ...prev, [tentativaRespostaId]: respostaId }));
    
    await salvarRespostaParcial(tentativaRespostaId, respostaId);
  };

  const handleFinalizar = async (forcarPorTempo = false) => {
    if (!forcarPorTempo && !confirm("Tem certeza que deseja entregar a prova?")) return;

    setFinalizado(true);
    setLoadingFim(true);

    const res = await finalizarProva(tentativa.id);
    
    if (res.success) {
      alert(`Prova finalizada! Sua nota foi: ${res.nota?.toFixed(1)}`);
      router.push("/dashboard");
    } else {
      alert("Erro ao finalizar a prova.");
      setLoadingFim(false);
    }
  };

  const minutos = Math.floor(tempoRestanteSegundos / 60);
  const segundos = tempoRestanteSegundos % 60;
  const tempoFormatado = `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;

  if (finalizado || tempoRestanteSegundos <= 0) {
    return (
      <Container size="sm" mt={50}>
        <Alert icon={<IconAlertCircle size="24"/>} title="Tempo Esgotado ou Prova Entregue" color="red" variant="filled">
          Processando suas respostas e calculando sua nota final. Aguarde...
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Paper p="md" radius="md" withBorder shadow="sm" mb="xl" style={{ position: 'sticky', top: 20, zIndex: 10 }}>
        <Group justify="space-between">
          <Title order={4}>{tentativa.prova.nome}</Title>
          <Group gap="xs">
            <IconClock color={tempoRestanteSegundos < 300 ? 'red' : 'gray'} />
            <Text fw={700} size="xl" c={tempoRestanteSegundos < 300 ? 'red' : 'inherit'}>
              {tempoFormatado}
            </Text>
          </Group>
        </Group>
        <Progress 
          value={(tempoRestanteSegundos / (tempoLimiteMinutos * 60)) * 100} 
          mt="sm" 
          color={tempoRestanteSegundos < 300 ? 'red' : 'blue'} 
        />
      </Paper>

      <Stack gap="xl">
        {tentativa.respostas.map((tr: any, index: number) => (
          <Paper key={tr.id} p="xl" radius="md" withBorder>
            <Text fw={600} size="lg" mb="lg">
              {index + 1}. {tr.pergunta.enunciado}
            </Text>
            {tr.pergunta.imagemUrl && (
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                    <Image 
                        src={tr.pergunta.imagemUrl} 
                        alt={`Imagem da questão ${index + 1}`} 
                        radius="md"
                        style={{ 
                            maxWidth: '100%', 
                            maxHeight: '400px', 
                            objectFit: 'contain',
                            display: 'inline-block' 
                        }}
                    />
                </div>
            )}        
            <Stack gap="sm">
              {tr.pergunta.respostas.map((r: any) => (
                <Radio
                  key={r.id}
                  label={r.textoAlternativa}
                  name={`pergunta-${tr.id}`}
                  value={r.id.toString()}
                  checked={respostas[tr.id] === r.id}
                  onChange={() => handleSelectAlternativa(tr.id, r.id)}
                  size="md"
                />
              ))}
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Group justify="center" mt={50}>
        <Button size="xl" color="green" onClick={() => handleFinalizar(false)} loading={loadingFim}>
          Entregar Prova
        </Button>
      </Group>
    </Container>
  );
}