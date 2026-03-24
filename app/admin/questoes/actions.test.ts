import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createGlobalQuestaoAction, 
  updateGlobalQuestaoAction, 
  deleteGlobalQuestaoAction 
} from './actions';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { writeFile } from 'fs/promises';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));
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

describe('Módulo de Questões - Server Actions', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUser as any).mockResolvedValue({ id: 1, role: 'ADMIN' });
  });

  describe('createGlobalQuestaoAction', () => {
    it('deve criar uma questão simples sem imagem e vincular a provas', async () => {
      const formData = new FormData();
      formData.append('enunciado', 'Qual a capital do Brasil?');
      formData.append('respostas', JSON.stringify([
        { texto: 'Rio de Janeiro', correta: false },
        { texto: 'Brasília', correta: true }
      ]));
      formData.append('provasIds', JSON.stringify([1, 2]));

      (prisma.pergunta.create as any).mockResolvedValue({ id: 100 });

      const result = await createGlobalQuestaoAction(formData);

      expect(result.success).toBe(true);
      
      expect(prisma.pergunta.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            enunciado: 'Qual a capital do Brasil?',
            respostas: {
              create: [
                { textoAlternativa: 'Rio de Janeiro', ehCorreta: false },
                { textoAlternativa: 'Brasília', ehCorreta: true }
              ]
            },
            provas: {
              connect: [{ id: 1 }, { id: 2 }] 
            }
          })
        })
      );
    });

    it('deve fazer upload da imagem e salvar a URL correta no banco', async () => {
      const formData = new FormData();
      formData.append('enunciado', 'O que é este logotipo?');
      formData.append('respostas', JSON.stringify([{ texto: 'React', correta: true },{ texto: 'Vue', correta: false }]));
      formData.append('provasIds', JSON.stringify([1])); 
      
      const fakeImage = new File(['conteudo-falso'], 'logo react.png', { type: 'image/png' });
      formData.append('imagem', 'placeholder'); 
      
      const originalGet = formData.get.bind(formData);
      formData.get = (key) => key === 'imagem' ? fakeImage : originalGet(key);

      (prisma.pergunta.create as any).mockResolvedValue({ id: 101 });

      const result = await createGlobalQuestaoAction(formData);

      if (!result.success) {
        console.error("MOTIVO DA FALHA NA ACTION:", result);
      }

      expect(result.success).toBe(true);
      expect(writeFile).toHaveBeenCalled();

      expect(prisma.pergunta.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            imagemUrl: expect.stringMatching(/^\/uploads\/questoes\/\d+-logoreact\.png$/)
          })
        })
      );
    });

    it('deve falhar se enviar dados vazios (Testando limites)', async () => {
      const formData = new FormData();

      const result = await createGlobalQuestaoAction(formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('obrigatórios');
      expect(prisma.pergunta.create).not.toHaveBeenCalled(); 
    });
  });

  describe('updateGlobalQuestaoAction', () => {
    it('deve atualizar enunciado, recriar respostas e alterar provas', async () => {
      const formData = new FormData();
      formData.append('id', '100');
      formData.append('enunciado', 'Nova Pergunta Editada');
      formData.append('respostas', JSON.stringify([{ texto: 'Alternativa Única', correta: true }]));
      formData.append('provasIds', JSON.stringify([3])); 

      (prisma.pergunta.findUnique as any).mockResolvedValue({ id: 100, imagemUrl: null });
      (prisma.resposta.deleteMany as any).mockResolvedValue({ count: 2 });
      (prisma.pergunta.update as any).mockResolvedValue({ id: 100 });

      const result = await updateGlobalQuestaoAction(formData);

      expect(result.success).toBe(true);
      expect(prisma.resposta.deleteMany).toHaveBeenCalledWith({ where: { perguntaId: 100 } });

      expect(prisma.pergunta.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 100 },
          data: expect.objectContaining({
            enunciado: 'Nova Pergunta Editada',
            provas: {
              set: [{ id: 3 }] 
            }
          })
        })
      );
    });
  });

  describe('deleteGlobalQuestaoAction', () => {
    it('deve excluir a questão pelo ID', async () => {
      (prisma.pergunta.delete as any).mockResolvedValue({ id: 100 });

      const result = await deleteGlobalQuestaoAction(100);

      expect(result.success).toBe(true);
      expect(prisma.pergunta.delete).toHaveBeenCalledWith({ where: { id: 100 } });
    });
  });

});