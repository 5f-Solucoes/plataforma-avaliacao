"use client";

import { useState } from "react";
import { 
  Table, ScrollArea, Group, Text, TextInput, Button, Badge, ActionIcon, 
  Modal, NumberInput, Select, Stack, Paper, Checkbox, Autocomplete
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSearch, IconPlus, IconPower, IconCheck, IconUsers, IconTrash } from "@tabler/icons-react";
import { createProvaAction, toggleStatusProvaAction, updateProvaAccessAction, updateProvaAction, deleteProvaAction } from "@/app/admin/provas/actions";
import { notifications } from "@mantine/notifications"; 

interface UserSimples {
  id: number;
  nome: string;
  email: string;
}

interface Prova {
  id: number;
  nome: string;
  categoria: string | null;
  tempoLimiteMinutos: number;
  qtdPerguntasSorteio: number;
  notaCorte: number;
  validadeMeses: number; 
  fabricante: { id: number; nome: string } | null;
  usuariosPermitidos: { id: number }[]; 
}

interface Fabricante {
  id: number;
  nome: string;
}

interface Props {
  provas: Prova[];
  fabricantes: Fabricante[];
  usuarios: UserSimples[]; 
}

export function ProvasManager({ provas, fabricantes, usuarios }: Props) {
  const [search, setSearch] = useState("");
  
  const [opened, { open, close }] = useDisclosure(false);
  const [accessOpened, { open: openAccess, close: closeAccess }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  
  const [selectedProva, setSelectedProva] = useState<Prova | null>(null);
  const [editingProva, setEditingProva] = useState<Prova | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]); 
  const [loading, setLoading] = useState(false);

  const filteredProvas = provas.filter((prova) => 
    prova.nome.toLowerCase().includes(search.toLowerCase()) ||
    (prova.fabricante?.nome || "").toLowerCase().includes(search.toLowerCase())
  );

  const categoriasUnicas = Array.from(
    new Set(provas.map(p => p.categoria).filter(Boolean))
  ).sort() as string[];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createProvaAction(formData);
    setLoading(false);
    
    if (res.success) {
      close();
      notifications.show({ title: 'Sucesso', message: 'Prova criada com sucesso!', color: 'green' });
    } else {
      notifications.show({ title: 'Erro', message: res.message, color: 'red' });
    }
  };

  const handleOpenEdit = (prova: Prova) => {
    setEditingProva(prova);
    openEdit();
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateProvaAction(formData);
    setLoading(false);
    
    if (res.success) {
      closeEdit();
      notifications.show({ title: 'Sucesso', message: 'Prova atualizada!', color: 'green' });
    } else {
      notifications.show({ title: 'Erro', message: res.message, color: 'red' });
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Tem certeza que deseja excluir esta prova permanentemente?")) return;
    setLoading(true);
    const res = await deleteProvaAction(id);
    setLoading(false);

    if (res.success) {
      closeEdit();
      notifications.show({ title: 'Excluída', message: 'Prova removida do sistema.', color: 'blue' });
    } else {
      notifications.show({ title: 'Erro', message: res.message, color: 'red' });
    }
  };

  const handleToggle = async (id: number, validade: number) => {
    await toggleStatusProvaAction(id, validade);
    notifications.show({ title: 'Atualizado', message: 'Status da prova alterado.', color: 'blue' });
  };

  const handleOpenAccess = (prova: Prova) => {
    setSelectedProva(prova);
    setSelectedUsers(prova.usuariosPermitidos.map(u => u.id.toString()));
    openAccess();
  };

  const handleSaveAccess = async () => {
    if (!selectedProva) return;
    setLoading(true);
    const ids = selectedUsers.map(Number);
    const res = await updateProvaAccessAction(selectedProva.id, ids);
    setLoading(false);
    if (res.success) {
      closeAccess();
      notifications.show({ title: 'Sucesso', message: res.message, color: 'green' });
    } else {
      notifications.show({ title: 'Erro', message: res.message, color: 'red' });
    }
  };

  const rows = filteredProvas.map((prova) => {
    const isAtivo = prova.validadeMeses > 0;
    
    return (
      <Table.Tr key={prova.id}>
        <Table.Td>{prova.id}</Table.Td>
        <Table.Td>
          <Text fw={600} c="blue" style={{ cursor: 'pointer' }} onClick={() => handleOpenEdit(prova)}>
            {prova.nome}
          </Text>
          <Text size="xs" c="dimmed">{prova.fabricante?.nome}</Text>
        </Table.Td>
        <Table.Td>
          <Badge color={prova.categoria === 'Cloud' ? 'blue' : 'gray'}>
            {prova.categoria || 'Geral'}
          </Badge>
        </Table.Td>
        <Table.Td>{prova.qtdPerguntasSorteio} qts / {prova.tempoLimiteMinutos} min</Table.Td>
        <Table.Td>{prova.notaCorte.toFixed(1)}</Table.Td>
        <Table.Td>
          <Badge color={isAtivo ? "green" : "red"} variant="light">
            {isAtivo ? "Ativo" : "Inativo"}
          </Badge>
        </Table.Td>
        <Table.Td>
          <Group gap={0} justify="flex-end">
             <ActionIcon variant="subtle" color={isAtivo ? "red" : "green"} onClick={() => handleToggle(prova.id, prova.validadeMeses)}>
                {isAtivo ? <IconPower size={16} /> : <IconCheck size={16} />}
             </ActionIcon>
          </Group>
        </Table.Td>
        <Table.Td>
          <Group gap="xs" justify="flex-end">
             <Button 
                variant="light" 
                color="blue" 
                size="xs" 
                leftSection={<IconUsers size={14} />}
                onClick={() => handleOpenAccess(prova)}
             >
                Acesso ({prova.usuariosPermitidos.length})
             </Button>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Stack>
      <Group justify="space-between">
        <TextInput
          placeholder="Pesquisar..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          style={{ flex: 1, maxWidth: 400 }}
        />
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Nova Prova
        </Button>
      </Group>

      <Paper withBorder radius="md" p="md">
        <ScrollArea>
          <Table verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Prova / Fabricante</Table.Th>
                <Table.Th>Categoria</Table.Th>
                <Table.Th>Configuração</Table.Th>
                <Table.Th>Corte</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th />
                <Table.Th style={{ textAlign: 'right' }}>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>

      <Modal opened={opened} onClose={close} title="Cadastrar Nova Prova">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput label="Nome" name="nome" required />
            <Select 
              label="Fabricante" 
              name="fabricanteId"
              data={fabricantes.map(f => ({ value: f.id.toString(), label: f.nome }))}
              required
              searchable
            />
            <Autocomplete 
              label="Categoria" 
              name="categoria" 
              data={categoriasUnicas}
              placeholder="Selecione ou digite uma nova..."
            />
            <Group grow>
                <NumberInput label="Tempo (min)" name="tempoLimite" defaultValue={60} min={1} required />
                <NumberInput label="Qtd. Questões" name="qtdPerguntas" defaultValue={10} min={1} required />
            </Group>
            <Group grow>
                <NumberInput label="Nota de Corte" name="notaCorte" defaultValue={7.0} decimalScale={1} fixedDecimalScale step={0.5} max={10} required />
                <NumberInput label="Validade (meses)" name="validadeMeses" defaultValue={12} min={0} />
            </Group>
            <Button type="submit" fullWidth mt="md" loading={loading}>
              Salvar
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal opened={editOpened} onClose={closeEdit} title={`Editar: ${editingProva?.nome}`}>
        {editingProva && (
          <form key={editingProva.id} onSubmit={handleEditSubmit}>
            <input type="hidden" name="id" value={editingProva.id} />
            
            <Stack gap="md">
              <TextInput label="Nome" name="nome" defaultValue={editingProva.nome} required />
              <Select 
                label="Fabricante" 
                name="fabricanteId"
                defaultValue={editingProva.fabricante?.id.toString()}
                data={fabricantes.map(f => ({ value: f.id.toString(), label: f.nome }))}
                required
                searchable
              />
              <Autocomplete 
                label="Categoria" 
                name="categoria" 
                defaultValue={editingProva.categoria || ""}
                data={categoriasUnicas}
                placeholder="Selecione ou digite uma nova..."
              />
              <Group grow>
                  <NumberInput label="Tempo (min)" name="tempoLimite" defaultValue={editingProva.tempoLimiteMinutos} min={1} required />
                  <NumberInput label="Qtd. Questões" name="qtdPerguntas" defaultValue={editingProva.qtdPerguntasSorteio} min={1} required />
              </Group>
              <Group grow>
                  <NumberInput label="Nota de Corte" name="notaCorte" defaultValue={editingProva.notaCorte} decimalScale={1} fixedDecimalScale step={0.5} max={10} required />
                  <NumberInput label="Validade (meses)" name="validadeMeses" defaultValue={editingProva.validadeMeses} min={0} />
              </Group>
              
              <Button type="submit" fullWidth mt="md" loading={loading}>
                Salvar Alterações
              </Button>
              
              <Button 
                color="red" 
                variant="light" 
                fullWidth 
                leftSection={<IconTrash size={16} />}
                onClick={() => handleDelete(editingProva.id)}
                loading={loading}
              >
                Excluir Prova
              </Button>
            </Stack>
          </form>
        )}
      </Modal>

      <Modal opened={accessOpened} onClose={closeAccess} title={`Liberar Acesso: ${selectedProva?.nome}`}>
         <Text size="sm" c="dimmed" mb="md">
            Selecione os usuários que podem visualizar e realizar esta prova.
         </Text>

         <ScrollArea h={300} type="auto" offsetScrollbars mb="md">
            <Checkbox.Group value={selectedUsers} onChange={setSelectedUsers}>
               <Stack gap="xs">
                  {usuarios.map(usuario => (
                     <Checkbox 
                        key={usuario.id} 
                        value={usuario.id.toString()} 
                        label={
                           <Text size="sm">
                              <span style={{ fontWeight: 500 }}>{usuario.nome}</span> ({usuario.email})
                           </Text>
                        } 
                     />
                  ))}
                  {usuarios.length === 0 && (
                     <Text c="dimmed" size="sm" ta="center">Nenhum aluno cadastrado no sistema.</Text>
                  )}
               </Stack>
            </Checkbox.Group>
         </ScrollArea>

         <Button fullWidth onClick={handleSaveAccess} loading={loading}>
            Salvar Acessos
         </Button>
      </Modal>
    </Stack>
  );
}