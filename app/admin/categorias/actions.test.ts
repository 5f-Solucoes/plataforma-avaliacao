import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renameCategoriaAction, deleteCategoriaAction } from './actions';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

describe('Módulo de Categorias - Server Actions', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUser as any).mockResolvedValue({ id: 1, role: 'ADMIN' });
  });

  describe('renameCategoriaAction', () => {
    
    it('deve renomear a categoria em múltiplas provas e retornar a contagem', async () => {
      (prisma.prova.updateMany as any).mockResolvedValue({ count: 5 });

      const result = await renameCategoriaAction('Cloud', 'Computação em Nuvem');

      expect(result.success).toBe(true);
      expect(result.message).toContain('5 prova(s) atualizada(s)');
      
      expect(prisma.prova.updateMany).toHaveBeenCalledWith({
        where: { categoria: 'Cloud' },
        data: { categoria: 'Computação em Nuvem' }
      });
    });

    it('deve remover espaços extras e salvar o nome limpo (trim)', async () => {
      (prisma.prova.updateMany as any).mockResolvedValue({ count: 1 });

      const result = await renameCategoriaAction('AWS', '   Amazon Web Services   ');

      expect(result.success).toBe(true);
      expect(prisma.prova.updateMany).toHaveBeenCalledWith({
        where: { categoria: 'AWS' },
        data: { categoria: 'Amazon Web Services' } 
      });
    });

    it('deve falhar se o novo nome for vazio ou apenas espaços', async () => {
      const result = await renameCategoriaAction('Cloud', '    ');

      expect(result.success).toBe(false);
      expect(result.message).toContain('não pode ser vazio');
      expect(prisma.prova.updateMany).not.toHaveBeenCalled(); 
    });

    it('deve bloquear a ação se o usuário for ALUNO (Teste de Segurança)', async () => {
      (getCurrentUser as any).mockResolvedValue({ id: 5, role: 'ALUNO' });

      const result = await renameCategoriaAction('Cloud', 'Hacked Category');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Erro ao renomear categoria.');
      expect(prisma.prova.updateMany).not.toHaveBeenCalled();
    });

  });

  describe('deleteCategoriaAction', () => {
    
    it('deve definir a categoria como null em todas as provas que a possuem', async () => {
      (prisma.prova.updateMany as any).mockResolvedValue({ count: 2 });

      const result = await deleteCategoriaAction('Categoria Inútil');

      expect(result.success).toBe(true);
      expect(result.message).toContain('removida de 2 prova(s)');
      
      expect(prisma.prova.updateMany).toHaveBeenCalledWith({
        where: { categoria: 'Categoria Inútil' },
        data: { categoria: null } 
      });
    });

    it('deve bloquear a exclusão se o usuário for ALUNO (Teste de Segurança)', async () => {
      (getCurrentUser as any).mockResolvedValue({ id: 5, role: 'ALUNO' });

      const result = await deleteCategoriaAction('Cloud');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Erro ao remover categoria.');
      expect(prisma.prova.updateMany).not.toHaveBeenCalled();
    });

  });

});