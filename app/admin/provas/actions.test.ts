import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createProvaAction, 
  updateProvaAction, 
  deleteProvaAction, 
  updateProvaAccessAction 
} from './actions';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(), 
}));

describe('Módulo de Provas - Server Actions', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUser as any).mockResolvedValue({ 
      id: 1, 
      nome: 'Admin Teste', 
      role: 'ADMIN' 
    });
  });

  describe('createProvaAction', () => {
    it('deve criar uma prova com os dados corretos convertidos', async () => {
      const formData = new FormData();
      formData.append('nome', 'Prova de Certificação AWS');
      formData.append('fabricanteId', '2');
      formData.append('categoria', 'Cloud');
      formData.append('tempoLimite', '120');
      formData.append('qtdPerguntas', '40');
      formData.append('notaCorte', '7.5');
      formData.append('validadeMeses', '24');

      (prisma.prova.create as any).mockResolvedValue({ id: 10, nome: 'Prova de Certificação AWS' });

      const result = await createProvaAction(formData);

      expect(result.success).toBe(true);

      expect(prisma.prova.create).toHaveBeenCalledTimes(1);

      expect(prisma.prova.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nome: 'Prova de Certificação AWS',
            fabricanteId: 2, 
            tempoLimiteMinutos: 120, 
            notaCorte: 7.5, 
          })
        })
      );
    });
  });

  describe('updateProvaAction', () => {
    it('deve atualizar uma prova existente corretamente', async () => {
      const formData = new FormData();
      formData.append('id', '10');
      formData.append('nome', 'Prova Atualizada');
      formData.append('fabricanteId', '2');
      formData.append('categoria', 'Security');
      formData.append('tempoLimite', '90');
      formData.append('qtdPerguntas', '30');
      formData.append('notaCorte', '8.0');
      formData.append('validadeMeses', '12');

      (prisma.prova.update as any).mockResolvedValue({ id: 10 });

      const result = await updateProvaAction(formData);

      expect(result.success).toBe(true);
      expect(prisma.prova.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 }, 
          data: expect.objectContaining({
            nome: 'Prova Atualizada',
            notaCorte: 8.0
          })
        })
      );
    });
  });

  describe('deleteProvaAction', () => {
    it('deve excluir uma prova pelo ID', async () => {
      (prisma.prova.delete as any).mockResolvedValue({ id: 10 });

      const result = await deleteProvaAction(10);

      expect(result.success).toBe(true);
      expect(prisma.prova.delete).toHaveBeenCalledWith({ where: { id: 10 } });
    });

    it('deve retornar erro se o banco de dados falhar (ex: prova em uso)', async () => {
      (prisma.prova.delete as any).mockRejectedValue(new Error('Foreign key constraint failed'));

      const result = await deleteProvaAction(10);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Erro ao excluir');
    });
  });

  describe('updateProvaAccessAction', () => {
    it('deve vincular os alunos à prova substituindo as conexões antigas', async () => {
      (prisma.prova.update as any).mockResolvedValue({ id: 10 });

      const result = await updateProvaAccessAction(10, [5, 8]);

      expect(result.success).toBe(true);
      expect(prisma.prova.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: {
            usuariosPermitidos: {
              set: [{ id: 5 }, { id: 8 }] 
            }
          }
        })
      );
    });
  });

});