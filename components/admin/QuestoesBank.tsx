"use client";

import { useState } from "react";
import { 
  Paper, TextInput, Title, Badge, Group, Text, Accordion, ThemeIcon, 
  ScrollArea, Container, Select, MultiSelect, Button, Modal, Stack, 
  ActionIcon, Checkbox, FileInput, Image, Alert
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { 
  IconSearch, IconCheck, IconX, IconDatabase, IconPlus, IconTrash, IconUpload, IconEdit 
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { createGlobalQuestaoAction, deleteGlobalQuestaoAction, updateGlobalQuestaoAction } from "@/app/admin/questoes/actions"; 

interface Resposta {
  id: number;
  textoAlternativa: string;
  ehCorreta: boolean;
}

interface ProvaSimples {
  id: number;
  nome: string;
  fabricante: { nome: string } | null;
}

interface Pergunta {
  id: number;
  enunciado: string;
  imagemUrl: string | null;
  provas: ProvaSimples[];
  respostas: Resposta[];
}

interface Props {
  questoes: Pergunta[];
  provasDisponiveis: { id: number; nome: string }[];
}

export function QuestoesBank({ questoes, provasDisponiveis }: Props) {
  const [search, setSearch] = useState("");
  const [provaFilter, setProvaFilter] = useState<string | null>(null);

  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [enunciado, setEnunciado] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [alternativas, setAlternativas] = useState([{ texto: "", correta: false }, { texto: "", correta: false }]);
  const [provasSelecionadas, setProvasSelecionadas] = useState<string[]>([]);

  const nomesProvasUnicas = Array.from(
    new Set(questoes.flatMap(q => q.provas.map(p => p.nome)))
  ).sort();

  const provasMultiSelectData = provasDisponiveis.map(p => ({
    value: p.id.toString(),
    label: p.nome
  }));

  const filtered = questoes.filter(q => {
    const matchText = q.enunciado.toLowerCase().includes(search.toLowerCase());
    const matchProva = provaFilter ? q.provas.some(p => p.nome === provaFilter) : true;
    return matchText && matchProva;
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setEnunciado("");
    setImagem(null);
    setAlternativas([{ texto: "", correta: false }, { texto: "", correta: false }]);
    setProvasSelecionadas([]);
    open();
  };

  const handleOpenEdit = (q: Pergunta) => {
    setEditingId(q.id);
    setEnunciado(q.enunciado);
    setAlternativas(q.respostas.map(r => ({ texto: r.textoAlternativa, correta: r.ehCorreta })));
    setProvasSelecionadas(q.provas.map(p => p.id.toString()));
    setImagem(null); 
    open();
  };

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

  const toggleCorreta = (index: number) => {
    const novas = [...alternativas];
    novas[index] = { ...novas[index], correta: !novas[index].correta };
    setAlternativas(novas);
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    const formData = new FormData();
    formData.append("enunciado", enunciado);
    formData.append("respostas", JSON.stringify(alternativas));
    formData.append("provasIds", JSON.stringify(provasSelecionadas.map(Number)));
    
    if (imagem) {
      formData.append("imagem", imagem);
    }

    let res;
    if (editingId) {
      formData.append("id", editingId.toString());
      res = await updateGlobalQuestaoAction(formData);
    } else {
      res = await createGlobalQuestaoAction(formData);
    }
    
    setLoading(false);

    if (res.success) {
      notifications.show({ title: 'Sucesso', message: res.message, color: 'green' });
      close();
    } else {
      notifications.show({ title: 'Erro', message: res.message, color: 'red' });
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Tem certeza que deseja excluir esta questão do banco? Ela será removida de TODAS as provas vinculadas.")) return;
    
    const res = await deleteGlobalQuestaoAction(id);
    if (res.success) {
      notifications.show({ message: "Questão excluída do banco", color: "blue" });
    } else {
      notifications.show({ message: "Erro ao excluir questão", color: "red" });
    }
  };

  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" mb="lg">
        <Group>
            <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                <IconDatabase size={20} />
            </ThemeIcon>
            <div>
                <Title order={4}>Banco Global de Questões</Title>
                <Text c="dimmed" size="sm">
                    {filtered.length} questões encontradas de {questoes.length} totais
                </Text>
            </div>
        </Group>
        <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
          Nova Questão
        </Button>
      </Group>

      <Group mb="xl" grow>
        <TextInput
            placeholder="Buscar pelo enunciado..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
        <Select 
            placeholder="Filtrar por Prova vinculada"
            data={nomesProvasUnicas}
            clearable
            searchable
            value={provaFilter}
            onChange={setProvaFilter}
        />
      </Group>

      <ScrollArea h={600} type="auto" offsetScrollbars>
        {filtered.length === 0 ? (
            <Text ta="center" c="dimmed" py="xl">Nenhuma questão encontrada com os filtros atuais.</Text>
        ) : (
            <Accordion variant="separated" radius="md">
            {filtered.map((q) => (
                <Accordion.Item key={q.id} value={q.id.toString()}>
                    <Accordion.Control>
                        <Group justify="space-between" mr="md">
                            <div style={{ flex: 1 }}>
                                <Text fw={500} lineClamp={1}>{q.enunciado}</Text>
                            </div>
                            <Group gap="xs">
                                {q.imagemUrl && <Badge variant="dot" color="blue">Img</Badge>}
                                {q.respostas.filter(r => r.ehCorreta).length > 1 && <Badge variant="light" color="orange">Múltipla</Badge>}
                                {q.provas.length === 0 ? (
                                    <Badge color="red" variant="light">Não vinculada</Badge>
                                ) : (
                                    <Badge color="blue" variant="light">
                                        {q.provas.length} {q.provas.length === 1 ? 'Prova' : 'Provas'}
                                    </Badge>
                                )}
                            </Group>
                        </Group>
                    </Accordion.Control>
                    
                    <Accordion.Panel>
                        <Container size="sm" px={0}>
                            <Text fw={700} mb="xs" c="dimmed">Provas Vinculadas:</Text>
                            <Group gap="xs" mb="md">
                                {q.provas.length === 0 ? (
                                    <Text size="sm" c="dimmed" fs="italic">Esta questão está órfã no banco.</Text>
                                ) : (
                                    q.provas.map(p => (
                                        <Badge key={p.id} color="gray" variant="outline">
                                            {p.nome}
                                        </Badge>
                                    ))
                                )}
                            </Group>

                            <Text fw={700} mb="sm" c="dimmed">Enunciado Completo:</Text>
                            <Text mb="md">{q.enunciado}</Text>
                            
                            {q.imagemUrl && (
                                <div style={{ marginBottom: 20, textAlign: 'center' }}>
                                    <Image 
                                        src={q.imagemUrl} 
                                        alt="Imagem da questão" 
                                        radius="md"
                                        style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', display: 'inline-block' }}
                                    />
                                </div>
                            )}

                            <Text fw={700} mb="sm" c="dimmed">Alternativas:</Text>
                            <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
                                {q.respostas.map((r, index) => (
                                    <Group 
                                        key={r.id} 
                                        p="sm" 
                                        bg={r.ehCorreta ? "green.1" : "transparent"} 
                                        style={{ 
                                            borderBottom: index < q.respostas.length - 1 ? '1px solid var(--mantine-color-default-border)' : 'none'
                                        }}
                                    >
                                        <ThemeIcon 
                                            color={r.ehCorreta ? "green" : "gray"} 
                                            variant={r.ehCorreta ? "filled" : "light"}
                                            size="sm"
                                            radius="xl"
                                        >
                                            {r.ehCorreta ? <IconCheck size={12}/> : <IconX size={12}/>}
                                        </ThemeIcon>
                                        
                                        <Text 
                                            size="sm" 
                                            c={r.ehCorreta ? "green.9" : "dimmed"}
                                            fw={r.ehCorreta ? 600 : 400}
                                        >
                                            {r.textoAlternativa}
                                        </Text>

                                        {r.ehCorreta && (
                                            <Badge size="xs" color="green" ml="auto">Correta</Badge>
                                        )}
                                    </Group>
                                ))}
                            </Paper>
                            
                            <Group justify="flex-end" mt="xl">
                                <Button color="blue" variant="subtle" size="sm" leftSection={<IconEdit size={16}/>} onClick={() => handleOpenEdit(q)}>
                                    Editar Questão
                                </Button>
                                <Button color="red" variant="subtle" size="sm" leftSection={<IconTrash size={16}/>} onClick={() => handleDelete(q.id)}>
                                    Excluir do Banco
                                </Button>
                            </Group>
                        </Container>
                    </Accordion.Panel>
                </Accordion.Item>
            ))}
            </Accordion>
        )}
      </ScrollArea>

      <Modal opened={opened} onClose={close} title={editingId ? "Editar Questão" : "Cadastrar Nova Questão"} size="lg" centered>
        <Stack>
            <Alert color="blue" title="Informação">
                Esta questão será salva no banco global. Você pode vinculá-la a uma ou mais provas agora ou fazer isso mais tarde.
            </Alert>

            <MultiSelect
                label="Vincular às Provas (Opcional)"
                placeholder="Selecione as provas que terão esta questão"
                data={provasMultiSelectData}
                value={provasSelecionadas}
                onChange={setProvasSelecionadas}
                searchable
                clearable
            />

            <TextInput 
                label="Enunciado da Pergunta" 
                placeholder="Ex: Qual a finalidade principal do serviço X?" 
                value={enunciado}
                onChange={(e) => setEnunciado(e.target.value)}
                required
            />

            <FileInput
                label="Imagem da Questão (Opcional)"
                description={editingId ? "Deixe em branco para manter a imagem atual." : ""}
                placeholder="Clique para anexar uma imagem"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                leftSection={<IconUpload size={14} />}
                value={imagem}
                onChange={setImagem}
                clearable
            />

            <Text fw={500} size="sm" mt="md">Alternativas (Marque a(s) correta(s))</Text>

            <ScrollArea.Autosize mah={300} offsetScrollbars>
                <Stack gap="sm">
                    {alternativas.map((alt, i) => (
                        <Group key={i} align="center">
                            <Checkbox
                                checked={alt.correta}
                                onChange={() => toggleCorreta(i)}
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
                {editingId ? "Salvar Alterações" : "Salvar Questão no Banco"}
            </Button>
        </Stack>
      </Modal>
    </Paper>
  );
}