"use client";

import { Card, Text, Radio, Checkbox, Group, Stack, Image, Badge } from "@mantine/core";
import { Pergunta } from "@/types";

interface QuestionCardProps {
  pergunta: Pergunta;
  respostasSelecionadas: number[];
  aoResponder: (idsRespostas: number[]) => void;
  numeroQuestao: number;
  totalQuestoes: number;
  multiplaEscolha?: boolean;
}

// Componente para exibir uma questão, suas alternativas e permitir que o usuário selecione a resposta correta (ou múltiplas respostas, se for o caso)
export function QuestionCard({
  pergunta,
  respostasSelecionadas,
  aoResponder,
  numeroQuestao,
  totalQuestoes,
  multiplaEscolha = false,
}: QuestionCardProps) {
  const handleRadio = (value: string) => {
    aoResponder([parseInt(value)]);
  };

  const handleCheckbox = (respostaId: number) => {
    const exists = respostasSelecionadas.includes(respostaId);
    aoResponder(
      exists
        ? respostasSelecionadas.filter(id => id !== respostaId)
        : [...respostasSelecionadas, respostaId]
    );
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Badge color="blue" variant="light">
          Questão {numeroQuestao} de {totalQuestoes}
        </Badge>
        <Group gap="xs">
          {multiplaEscolha && (
            <Badge color="orange" variant="light">
              Múltipla Escolha
            </Badge>
          )}
          <Badge color="gray" variant="outline">
            TI / Infraestrutura
          </Badge>
        </Group>
      </Group>

      <Text fw={500} size="lg" mb="md">
        {pergunta.enunciado}
      </Text>

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

      {multiplaEscolha ? (
        <Stack mt="xs">
          <Text size="sm" c="dimmed" fw={500}>Selecione todas as alternativas corretas</Text>
          {pergunta.respostas.map((resp) => (
            <Checkbox
              key={resp.id}
              checked={respostasSelecionadas.includes(resp.id)}
              onChange={() => handleCheckbox(resp.id)}
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
      ) : (
        <Radio.Group
          value={respostasSelecionadas[0]?.toString() || ""}
          onChange={handleRadio}
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
      )}
    </Card>
  );
}
