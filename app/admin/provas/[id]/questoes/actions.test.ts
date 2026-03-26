import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createQuestaoAction, deleteQuestaoAction } from './actions';
import { prisma } from '@/lib/prisma';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('fs/promises', () => {
  const writeFileMock = vi.fn().mockResolvedValue(undefined);
  const mkdirMock = vi.fn().mockResolvedValue(undefined);
  return {
    __esModule: true,
    default: { writeFile: writeFileMock, mkdir: mkdirMock },
    writeFile: writeFileMock,
    mkdir: mkdirMock,
  };
});

describe('Questões de Prova Específica - Server Actions', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createQuestaoAction', () => {
    it('deve criar uma questão com resposta única correta', async () => {
      const formData = new FormData();
      formData.append('enunciado', 'Qual protocolo usa a porta 443?');
      formData.append('respostas', JSON.stringify([
        { texto: 'HTTP', correta: false },
        { texto: 'HTTPS', correta: true },
        { texto: 'FTP', correta: false }
      ]));

      (prisma.pergunta.create as any).mockResolvedValue({ id: 50 });

      const result = await createQuestaoAction(1, formData);

      expect(result.success).toBe(true);
      expect(prisma.pergunta.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            enunciado: 'Qual protocolo usa a porta 443?',
            respostas: {
              create: [
                { textoAlternativa: 'HTTP', ehCorreta: false },
                { textoAlternativa: 'HTTPS', ehCorreta: true },
                { textoAlternativa: 'FTP', ehCorreta: false }
              ]
            }
          })
        })
      );
    });

    it('deve criar uma questão com MÚLTIPLAS respostas corretas', async () => {
      const formData = new FormData();
      formData.append('enunciado', 'Quais são protocolos de camada de transporte?');
      formData.append('respostas', JSON.stringify([
        { texto: 'TCP', correta: true },
        { texto: 'UDP', correta: true },
        { texto: 'HTTP', correta: false },
        { texto: 'DNS', correta: false }
      ]));

      (prisma.pergunta.create as any).mockResolvedValue({ id: 51 });

      const result = await createQuestaoAction(1, formData);

      expect(result.success).toBe(true);
      expect(prisma.pergunta.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            respostas: {
              create: [
                { textoAlternativa: 'TCP', ehCorreta: true },
                { textoAlternativa: 'UDP', ehCorreta: true },
                { textoAlternativa: 'HTTP', ehCorreta: false },
                { textoAlternativa: 'DNS', ehCorreta: false }
              ]
            }
          })
        })
      );
    });

    it('deve falhar se não informar enunciado', async () => {
      const formData = new FormData();
      formData.append('respostas', JSON.stringify([
        { texto: 'A', correta: true },
        { texto: 'B', correta: false }
      ]));

      const result = await createQuestaoAction(1, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('obrigatórios');
      expect(prisma.pergunta.create).not.toHaveBeenCalled();
    });

    it('deve falhar se tiver menos de 2 alternativas', async () => {
      const formData = new FormData();
      formData.append('enunciado', 'Pergunta?');
      formData.append('respostas', JSON.stringify([
        { texto: 'Única', correta: true }
      ]));

      const result = await createQuestaoAction(1, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('pelo menos 2');
      expect(prisma.pergunta.create).not.toHaveBeenCalled();
    });

    it('deve falhar se nenhuma alternativa for marcada como correta', async () => {
      const formData = new FormData();
      formData.append('enunciado', 'Pergunta sem correta?');
      formData.append('respostas', JSON.stringify([
        { texto: 'A', correta: false },
        { texto: 'B', correta: false }
      ]));

      const result = await createQuestaoAction(1, formData);

      expect(result.success).toBe(false);
      expect(prisma.pergunta.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteQuestaoAction', () => {
    it('deve excluir respostas e depois a questão', async () => {
      (prisma.resposta.deleteMany as any).mockResolvedValue({ count: 3 });
      (prisma.pergunta.delete as any).mockResolvedValue({ id: 50 });

      const result = await deleteQuestaoAction(50, 1);

      expect(result.success).toBe(true);
      expect(prisma.resposta.deleteMany).toHaveBeenCalledWith({ where: { perguntaId: 50 } });
      expect(prisma.pergunta.delete).toHaveBeenCalledWith({ where: { id: 50 } });
    });

    it('deve retornar erro se a exclusão falhar', async () => {
      (prisma.resposta.deleteMany as any).mockRejectedValue(new Error('FK constraint'));

      const result = await deleteQuestaoAction(50, 1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Erro');
    });
  });

});
