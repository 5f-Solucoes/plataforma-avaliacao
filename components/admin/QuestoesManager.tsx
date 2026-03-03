"use client";

import { useState } from "react";
import { 
  Title, Paper, Button, Group, Text, Modal, Stack, TextInput, 
  ActionIcon, Radio, Accordion, Badge, Alert, ScrollArea 
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconTrash, IconArrowLeft, IconCheck } from "@tabler/icons-react";
import { createQuestaoAction, deleteQuestaoAction } from "@/app/admin/provas/[id]/questoes/actions";
import { notifications } from "@mantine/notifications";
import Link from "next/link";

interface Resposta {
  id: number;
  textoAlternativa: string;
  ehCorreta: boolean;
}

interface Pergunta {
  id: number;
  enunciado: string;
  respostas: Resposta[];
}

interface Props {
  provaId: number;
  provaNome: string;
  questoes: Pergunta[];
}

export function QuestoesManager({ provaId, provaNome, questoes }: Props) {
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);

  const [enunciado, setEnunciado] = useState("");
  const [alternativas, setAlternativas] = useState([{ texto: "", correta: false }, { texto: "", correta: false }]);

  const addAlternativa = () => {
    setAlternativas([...alternativas, { texto: "", correta: false }]);
  };

  const removeAlternativa = (index: number) => {
    if (alternativas.length <= 2) return; 
    const novas = alternativas.filter((_, i) => i !== index);
    setAlternativas(novas);
  };

  const updateAlternativaTexto = (index: number, texto: string) => {
    const novas = [...alternativas];
    novas[index].texto = texto;
    setAlternativas(novas);
  };

  const setCorreta = (index: number) => {
    const novas = alternativas.map((a, i) => ({ ...a, correta: i === index }));
    setAlternativas(novas);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const res = await createQuestaoAction(provaId, enunciado, alternativas);
    setLoading(false);

    if (res.success) {
      notifications.show({ title: 'Sucesso', message: res.message, color: 'green' });
      close();
      setEnunciado("");
      setAlternativas([{ texto: "", correta: false }, { texto: "", correta: false }]);
    } else {
      notifications.show({ title: 'Erro', message: res.message, color: 'red' });
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Tem certeza que deseja excluir esta questão?")) return;
    await deleteQuestaoAction(id, provaId);
    notifications.show({ message: "Questão excluída", color: "blue" });
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Group>
            <Button variant="subtle" leftSection={<IconArrowLeft size={16}/>} component={Link} href="/admin/provas">
                Voltar
            </Button>
            <div>
                <Title order={3}>Questões da Prova</Title>
                <Text c="dimmed" size="sm">{provaNome} ({questoes.length} cadastradas)</Text>
            </div>
        </Group>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>Adicionar Questão</Button>
      </Group>

      {questoes.length === 0 ? (
        <Alert color="gray" title="Nenhuma questão">Esta prova ainda não possui questões cadastradas.</Alert>
      ) : (
        <Paper withBorder radius="md">
            <Accordion variant="separated">
                {questoes.map((q, index) => (
                    <Accordion.Item key={q.id} value={q.id.toString()}>
                        <Accordion.Control>
                            <Group justify="space-between" mr="md">
                                <Text fw={500}>#{index + 1} - {q.enunciado}</Text>
                                <Badge variant="light" color="gray">{q.respostas.length} alt.</Badge>
                            </Group>
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Stack gap="xs">
                                {q.respostas.map((r) => (
                                    <Group key={r.id}>
                                        {r.ehCorreta ? <IconCheck color="green" size={16} /> : <div style={{width: 16}} />}
                                        <Text c={r.ehCorreta ? "green" : "dimmed"}>{r.textoAlternativa}</Text>
                                    </Group>
                                ))}
                                <Group justify="flex-end" mt="md">
                                    <Button color="red" variant="subtle" size="xs" leftSection={<IconTrash size={14}/>} onClick={() => handleDelete(q.id)}>
                                        Excluir Questão
                                    </Button>
                                </Group>
                            </Stack>
                        </Accordion.Panel>
                    </Accordion.Item>
                ))}
            </Accordion>
        </Paper>
      )}

      {/* MODAL DE CADASTRO */}
      <Modal opened={opened} onClose={close} title="Nova Questão" size="lg">
        <Stack>
            <TextInput 
                label="Enunciado da Pergunta" 
                placeholder="Ex: Qual é a capital do Brasil?" 
                value={enunciado}
                onChange={(e) => setEnunciado(e.target.value)}
                required
            />

            <Text fw={500} size="sm" mt="md">Alternativas (Marque a correta)</Text>
            
            <ScrollArea.Autosize mah={300} offsetScrollbars>
                <Stack gap="sm">
                    {alternativas.map((alt, i) => (
                        <Group key={i} align="center">
                            <Radio 
                                checked={alt.correta} 
                                onChange={() => setCorreta(i)}
                                name="correta"
                                value={i.toString()}
                            />
                            <TextInput 
                                style={{ flex: 1 }}
                                placeholder={`Alternativa ${i + 1}`}
                                value={alt.texto}
                                onChange={(e) => updateAlternativaTexto(i, e.target.value)}
                            />
                            <ActionIcon color="red" variant="subtle" onClick={() => removeAlternativa(i)} disabled={alternativas.length <= 2}>
                                <IconTrash size={16} />
                            </ActionIcon>
                        </Group>
                    ))}
                </Stack>
            </ScrollArea.Autosize>

            <Button variant="default" size="xs" onClick={addAlternativa} leftSection={<IconPlus size={14}/>}>
                Adicionar mais uma alternativa
            </Button>

            <Button fullWidth mt="md" onClick={handleSubmit} loading={loading}>
                Salvar Questão
            </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}