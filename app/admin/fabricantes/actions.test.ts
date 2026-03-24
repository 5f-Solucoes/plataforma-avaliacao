import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveFabricanteAction, deleteFabricanteAction } from './actions';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

describe('Módulo de Fabricantes - Server Actions', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUser as any).mockResolvedValue({ id: 1, role: 'ADMIN' });
  });

  describe('saveFabricanteAction', () => {
    
    it('deve CRIAR um novo fabricante quando o ID for null', async () => {
      const formData = new FormData();
      formData.append('nome', 'Amazon Web Services');
      formData.append('site', 'https://aws.amazon.com');
      formData.append('areaAtuacao', 'Cloud Computing');

      (prisma.fabricante.create as any).mockResolvedValue({ id: 10 });

      const result = await saveFabricanteAction(null, formData);

      expect(result.success).toBe(true);
      expect(result.message).toContain('cadastrado com sucesso');
      
      expect(prisma.fabricante.create).toHaveBeenCalledWith({
        data: {
          nome: 'Amazon Web Services',
          site: 'https://aws.amazon.com',
          areaAtuacao: 'Cloud Computing'
        }
      });
      expect(prisma.fabricante.update).not.toHaveBeenCalled(); 
    });

    it('deve ATUALIZAR um fabricante existente quando o ID for fornecido', async () => {
      const formData = new FormData();
      formData.append('nome', 'AWS Editado');
      formData.append('site', ''); 
      formData.append('areaAtuacao', 'Cloud');

      (prisma.fabricante.update as any).mockResolvedValue({ id: 10 });

      const result = await saveFabricanteAction(10, formData);

      expect(result.success).toBe(true);
      expect(result.message).toContain('atualizado com sucesso');
      
      expect(prisma.fabricante.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: {
          nome: 'AWS Editado',
          site: '',
          areaAtuacao: 'Cloud'
        }
      });
      expect(prisma.fabricante.create).not.toHaveBeenCalled();
    });

    it('deve falhar se o nome não for preenchido', async () => {
      const formData = new FormData();

      const result = await saveFabricanteAction(null, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('nome é obrigatório');
      expect(prisma.fabricante.create).not.toHaveBeenCalled();
    });

    it('deve bloquear a ação se o usuário for ALUNO (Teste de Segurança)', async () => {
      (getCurrentUser as any).mockResolvedValue({ id: 5, role: 'ALUNO' });
      const formData = new FormData();
      formData.append('nome', 'Hacker Corp');

      const result = await saveFabricanteAction(null, formData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Erro ao salvar fabricante.');
      expect(prisma.fabricante.create).not.toHaveBeenCalled();
    });

  });

  describe('deleteFabricanteAction', () => {
    
    it('deve DELETAR o fabricante se não houver provas vinculadas', async () => {
      (prisma.prova.count as any).mockResolvedValue(0);
      (prisma.fabricante.delete as any).mockResolvedValue({ id: 5 });

      const result = await deleteFabricanteAction(5);

      expect(result.success).toBe(true);
      expect(result.message).toContain('excluído com sucesso');
      
      expect(prisma.prova.count).toHaveBeenCalledWith({ where: { fabricanteId: 5 } });
      expect(prisma.fabricante.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    });

    it('deve BLOQUEAR a exclusão se houver provas vinculadas', async () => {
      (prisma.prova.count as any).mockResolvedValue(3);

      const result = await deleteFabricanteAction(5);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Existem 3 prova(s) vinculada(s)');
      
      expect(prisma.fabricante.delete).not.toHaveBeenCalled();
    });

    it('deve bloquear a exclusão se o usuário for ALUNO (Teste de Segurança)', async () => {
      (getCurrentUser as any).mockResolvedValue({ id: 5, role: 'ALUNO' });

      const result = await deleteFabricanteAction(5);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Erro ao excluir fabricante.');
      expect(prisma.fabricante.delete).not.toHaveBeenCalled();
    });

  });

});