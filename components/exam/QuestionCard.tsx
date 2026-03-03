"use client";

import { Card, Text, Radio, Group, Stack, Image, Badge } from "@mantine/core";
import { Pergunta } from "@/types";

interface QuestionCardProps {
  pergunta: Pergunta;
  respostaSelecionada: number | undefined;
  aoResponder: (idResposta: string) => void;
  numeroQuestao: number;
  totalQuestoes: number;
}

export function QuestionCard({
  pergunta,
  respostaSelecionada,
  aoResponder,
  numeroQuestao,
  totalQuestoes,
}: QuestionCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      {/* Cabeçalho da Questão */}
      <Group justify="space-between" mb="xs">
        <Badge color="blue" variant="light">
          Questão {numeroQuestao} de {totalQuestoes}
        </Badge>
        <Badge color="gray" variant="outline">
          TI / Infraestrutura
        </Badge>
      </Group>

      {/* Enunciado */}
      <Text fw={500} size="lg" mb="md">
        {pergunta.enunciado}
      </Text>

      {/* Imagem (Opcional) */}
      {pergunta.imagemUrl && (
        <Card.Section mb="md">
          <Image
            src={pergunta.imagemUrl}
            height={200}
            alt="Imagem da questão"
            fit="contain"
          />
        </Card.Section>
      )}

      {/* Alternativas usando Mantine Radio Group */}
      <Radio.Group
        value={respostaSelecionada?.toString() || ""}
        onChange={aoResponder}
        name={`questao-${pergunta.id}`}
        label="Selecione a alternativa correta"
        withAsterisk
      >
        <Stack mt="xs">
          {pergunta.respostas.map((resp) => (
            <Radio
                key={resp.id}
                value={resp.id.toString()}
                label={resp.texto}
                size="md"
                styles={{
                    root: { 
                    padding: "10px", 
                    borderRadius: "8px", 
                    border: "1px solid #eee",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                    
                    '&:hover': {
                        backgroundColor: "#f8f9fa"
                    },
                    
                    '&[data-checked]': {
                        borderColor: '#228be6', 
                        backgroundColor: '#e7f5ff'
                    }
                    },
                    label: {
                    paddingLeft: '10px'
                    }
                }}
                />
          ))}
        </Stack>
      </Radio.Group>
    </Card>
  );
}