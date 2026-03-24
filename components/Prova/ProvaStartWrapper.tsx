"use client";

import { useState } from "react";
import { Button, Paper, Title, Text, Center, Stack, ThemeIcon, Group } from "@mantine/core";
import { IconAlertCircle, IconClock, IconFileDescription, IconTarget } from "@tabler/icons-react";
import { ExamRunner } from "./ExamRunner";
import { iniciarOuRetomarProva } from "@/app/prova/[id]/actions";
import { notifications } from "@mantine/notifications";

export function ProvaStartWrapper({ prova, tentativaAberta }: any) {
   const [tentativa, setTentativa] = useState(tentativaAberta);
   const [loading, setLoading] = useState(false);

   const handleStart = async () => {
      setLoading(true);
      try {
         const novaTentativa = await iniciarOuRetomarProva(prova.id);
         
         const tentativaSanitizada = {
            ...novaTentativa,
            prova: prova,
            notaFinal: novaTentativa.notaFinal ? Number(novaTentativa.notaFinal) : null
         };
         
         setTentativa(tentativaSanitizada);
      } catch (e) {
         notifications.show({ title: "Erro", message: "Não foi possível iniciar a prova.", color: "red" });
      }
      setLoading(false);
   };

   if (tentativa) {
      return <ExamRunner tentativa={tentativa} tempoLimiteMinutos={prova.tempoLimiteMinutos} />;
   }

   return (
      <Center mt={50}>
         <Paper p="xl" radius="md" withBorder shadow="sm" style={{ maxWidth: 600, width: '100%' }}>
            <Stack gap="lg" align="center">
               <ThemeIcon size={80} radius="xl" variant="light" color="blue">
                  <IconFileDescription size={40} />
               </ThemeIcon>

               <Title order={2} ta="center">{prova.nome}</Title>
               
               <Text c="dimmed" ta="center" mb="md">
                  Leia as instruções atentamente antes de iniciar. O cronômetro não poderá ser pausado.
               </Text>

               <Group grow w="100%" mb="md">
                  <Paper withBorder p="md" radius="md" ta="center">
                     <IconClock size={24} color="var(--mantine-color-blue-6)" />
                     <Text fw={700} mt="xs">{prova.tempoLimiteMinutos} Minutos</Text>
                     <Text size="xs" c="dimmed">Tempo de Duração</Text>
                  </Paper>
                  <Paper withBorder p="md" radius="md" ta="center">
                     <IconAlertCircle size={24} color="var(--mantine-color-orange-6)" />
                     <Text fw={700} mt="xs">{prova.qtdPerguntasSorteio} Questões</Text>
                     <Text size="xs" c="dimmed">Múltipla Escolha</Text>
                  </Paper>
                  <Paper withBorder p="md" radius="md" ta="center">
                     <IconTarget size={24} color="var(--mantine-color-green-6)" />
                     <Text fw={700} mt="xs">{prova.notaCorte.toFixed(1)}</Text>
                     <Text size="xs" c="dimmed">Nota Mínima</Text>
                  </Paper>
               </Group>

               <Button size="xl" fullWidth onClick={handleStart} loading={loading} color="blue">
                  INICIAR AVALIAÇÃO AGORA
               </Button>
            </Stack>
         </Paper>
      </Center>
   );
}