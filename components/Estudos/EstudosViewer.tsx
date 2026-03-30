"use client";

import { useState } from "react";
import { 
  Title, Text, Paper, Stack, Group, Badge, Button, ActionIcon, 
  TextInput, Select, Textarea, Card, SimpleGrid, FileInput 
} from "@mantine/core";
import { 
  IconArrowLeft, IconLink, IconTrash, IconPlus, IconVideo, 
  IconFileText, IconBook, IconPhoto, IconUpload 
} from "@tabler/icons-react";
import Link from "next/link";
import { createEstudoAction, deleteEstudoAction } from "@/app/estudos/[id]/actions";
import { notifications } from "@mantine/notifications";

interface Material {
  id: number;
  titulo: string;
  descricao: string | null;
  tipo: string;
  url: string | null;
}

interface ProvaEstudo {
  id: number;
  nome: string;
  fabricante: { nome: string } | null;
  materiais: Material[];
}

interface Props {
  prova: ProvaEstudo;
  userRole: string; 
}

// Componente para exibir o material de estudo de uma prova específica, permitindo que instrutores/admins adicionem ou removam conteúdos
export function EstudosViewer({ prova, userRole }: Props) {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState<string>("LINK");

  const canEdit = userRole === "ADMIN" || userRole === "INSTRUCTOR";

  const getIcon = (tipo: string) => {
    switch(tipo) {
      case 'VIDEO': return <IconVideo size={20} color="red" />;
      case 'PDF': return <IconFileText size={20} color="orange" />;
      case 'TEXTO': return <IconBook size={20} color="blue" />;
      case 'IMAGEM': return <IconPhoto size={20} color="teal" />;
      default: return <IconLink size={20} color="gray" />;
    }
  };

  const getCorBadge = (tipo: string) => {
    switch(tipo) {
      case 'VIDEO': return 'red';
      case 'PDF': return 'orange';
      case 'TEXTO': return 'blue';
      case 'IMAGEM': return 'teal';
      default: return 'gray';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createEstudoAction(prova.id, formData);
    setLoading(false);

    if (res.success) {
      notifications.show({ title: 'Sucesso', message: res.message, color: 'green' });
      setShowForm(false);
      setTipoSelecionado("LINK"); 
    } else {
      notifications.show({ title: 'Erro', message: res.message, color: 'red' });
    }
  };

  const handleDelete = async (materialId: number) => {
    if(!confirm("Remover este material de estudo?")) return;
    const res = await deleteEstudoAction(materialId, prova.id);
    if (res.success) {
      notifications.show({ message: res.message, color: 'blue' });
    }
  };

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <div>
          <Button variant="subtle" component={Link} href="/estudos" leftSection={<IconArrowLeft size={16} />} px={0} mb="sm">
            Voltar para Provas
          </Button>
          <Title order={2}>Material de Estudo: {prova.nome}</Title>
          <Text c="dimmed">{prova.fabricante?.nome || "Geral"}</Text>
        </div>
        
        {canEdit && (
          <Button leftSection={<IconPlus size={16} />} onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar Cadastro" : "Adicionar Material"}
          </Button>
        )}
      </Group>

      {canEdit && showForm && (
        <Paper withBorder p="lg" radius="md">
          <Title order={5} mb="md">Cadastrar Novo Conteúdo</Title>
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <Group grow align="flex-start">
                <TextInput label="Título" name="titulo" placeholder="Ex: Guia Oficial AWS" required />
                <Select 
                  label="Tipo de Material" 
                  name="tipo" 
                  data={['LINK', 'TEXTO', 'PDF', 'IMAGEM']} 
                  value={tipoSelecionado}
                  onChange={(val) => setTipoSelecionado(val || 'LINK')}
                  required 
                />
              </Group>

              {tipoSelecionado === 'LINK' && (
                <TextInput label="URL do Link" name="url" placeholder="https://..." required />
              )}

              {tipoSelecionado === 'PDF' && (
                <FileInput label="Anexar Arquivo PDF" name="arquivo" accept="application/pdf" leftSection={<IconUpload size={14} />} placeholder="Clique para selecionar o PDF" required />
              )}

              {tipoSelecionado === 'IMAGEM' && (
                <FileInput label="Anexar Imagem" name="arquivo" accept="image/png,image/jpeg,image/jpg" leftSection={<IconUpload size={14} />} placeholder="Clique para selecionar a Imagem" required />
              )}

              {tipoSelecionado === 'TEXTO' ? (
                <Textarea label="Conteúdo do Estudo" name="descricao" placeholder="Escreva todo o material de estudo aqui..." autosize minRows={8} required />
              ) : (
                <Textarea label="Descrição Breve (Opcional)" name="descricao" placeholder="Escreva dicas ou um pequeno resumo..." autosize minRows={2} />
              )}

              <Group justify="flex-end" mt="sm">
                <Button type="submit" loading={loading} color="green">Salvar Conteúdo</Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      )}

      {prova.materiais.length === 0 ? (
        <Paper withBorder p="xl" radius="md" ta="center">
          <Text c="dimmed">Nenhum material de estudo foi disponibilizado para esta prova ainda.</Text>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {prova.materiais.map((mat) => (
            <Card key={mat.id} shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" align="flex-start" mb="xs">
                <div style={{ flex: 1 }}>
                  <Group gap="xs" mb={4}>
                    <Badge color={getCorBadge(mat.tipo)} variant="light" size="xs">
                      {mat.tipo}
                    </Badge>
                    <Group gap={4}>
                      {getIcon(mat.tipo)}
                      <Text fw={600} size="md">{mat.titulo}</Text>
                    </Group>
                  </Group>
                </div>
                
                {canEdit && (
                  <ActionIcon color="red" variant="subtle" onClick={() => handleDelete(mat.id)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                )}
              </Group>
              
              {mat.descricao && (
                <Text 
                  size="sm" 
                  c={mat.tipo === 'TEXTO' ? undefined : "dimmed"} 
                  mb="md" 
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {mat.descricao}
                </Text>
              )}

              {mat.url && (
                <Button 
                  component="a" 
                  href={mat.url} 
                  target="_blank" 
                  variant="light" 
                  color={getCorBadge(mat.tipo)}
                  fullWidth 
                  mt="auto"
                  leftSection={getIcon(mat.tipo)}
                >
                  Acessar {mat.tipo === 'VIDEO' ? 'Vídeo' : mat.tipo === 'PDF' ? 'Documento' : mat.tipo === 'IMAGEM' ? 'Imagem' : 'Link'}
                </Button>
              )}
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}