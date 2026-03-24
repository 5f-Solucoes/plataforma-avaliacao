import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateProfileAction, changePasswordAction } from './actions';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hash, compare } from 'bcryptjs';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('bcryptjs', () => ({
  hash: vi.fn(),
  compare: vi.fn()
}));

describe('Módulo de Configurações - Server Actions', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUser as any).mockResolvedValue({ id: 1, nome: 'João', email: 'joao@teste.com' });
  });

  describe('updateProfileAction', () => {
    
    it('deve atualizar o nome e email com sucesso', async () => {
      const formData = new FormData();
      formData.append('nome', 'João Atualizado');
      formData.append('email', 'novoemail@teste.com');

      (prisma.usuario.update as any).mockResolvedValue({ id: 1 });

      const result = await updateProfileAction(formData);

      expect(result.success).toBe(true);
      expect(prisma.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { nome: 'João Atualizado', email: 'novoemail@teste.com' }
        })
      );
    });

    it('deve falhar e retornar erro se o email já estiver em uso no banco', async () => {
      const formData = new FormData();
      formData.append('nome', 'João');
      formData.append('email', 'email_duplicado@teste.com');

      (prisma.usuario.update as any).mockRejectedValue(new Error('Unique constraint failed'));

      const result = await updateProfileAction(formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('e-mail já em uso');
    });

    it('deve bloquear a ação se não estiver autenticado', async () => {
      (getCurrentUser as any).mockResolvedValue(null);
      const formData = new FormData();

      const result = await updateProfileAction(formData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Não autorizado.');
      expect(prisma.usuario.update).not.toHaveBeenCalled();
    });

  });

  describe('changePasswordAction', () => {
    
    it('deve bloquear se a Nova Senha e a Confirmação forem diferentes', async () => {
      const formData = new FormData();
      formData.append('senhaAtual', 'minha_senha_velha');
      formData.append('novaSenha', 'senha123');
      formData.append('confirmarSenha', 'senhaDIFERENTE');

      const result = await changePasswordAction(formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('não conferem');
      expect(prisma.usuario.update).not.toHaveBeenCalled();
    });

    it('deve bloquear se a Senha Atual digitada estiver errada', async () => {
      const formData = new FormData();
      formData.append('senhaAtual', 'senha_velha_ERRADA');
      formData.append('novaSenha', 'senha123');
      formData.append('confirmarSenha', 'senha123');

      (prisma.usuario.findUnique as any).mockResolvedValue({ id: 1, senhaHash: 'hash_real_do_banco' });
      
      (compare as any).mockResolvedValue(false);

      const result = await changePasswordAction(formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('incorreta');
      expect(prisma.usuario.update).not.toHaveBeenCalled();
    });

    it('deve alterar a senha com sucesso e salvar o novo HASH no banco', async () => {
      const formData = new FormData();
      formData.append('senhaAtual', 'senha_velha_CERTA');
      formData.append('novaSenha', 'nova_senha_super_segura');
      formData.append('confirmarSenha', 'nova_senha_super_segura');

      (prisma.usuario.findUnique as any).mockResolvedValue({ id: 1, senhaHash: 'hash_antiga' });
      
      (compare as any).mockResolvedValue(true);
      
      (hash as any).mockResolvedValue('NOVO_HASH_CRIPTOGRAFADO');

      const result = await changePasswordAction(formData);

      expect(result.success).toBe(true);
      
      expect(prisma.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { senhaHash: 'NOVO_HASH_CRIPTOGRAFADO' }
        })
      );
    });

  });

});