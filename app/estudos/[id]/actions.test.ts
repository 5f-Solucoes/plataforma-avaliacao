import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEstudoAction, deleteEstudoAction } from './actions';
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

describe('Módulo de Estudos - Server Actions', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUser as any).mockResolvedValue({ id: 2, role: 'INSTRUCTOR' });
  });

  describe('createEstudoAction', () => {
    
    it('deve bloquear a criação se o usuário for um ALUNO (Teste de Segurança)', async () => {
      (getCurrentUser as any).mockResolvedValue({ id: 3, role: 'ALUNO' });
      
      const formData = new FormData();
      formData.append('titulo', 'Guia Hacker');
      formData.append('tipo', 'LINK');
      
      const result = await createEstudoAction(1, formData); 
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Sem permissão');
      expect(prisma.materialEstudo.create).not.toHaveBeenCalled(); 
    });

    it('deve criar um material do tipo TEXTO ou LINK (Sem upload de ficheiro)', async () => {
      const formData = new FormData();
      formData.append('titulo', 'Guia Oficial AWS');
      formData.append('tipo', 'LINK');
      formData.append('url', 'https://aws.amazon.com/pt/certification/');
      formData.append('descricao', 'Leitura obrigatória');

      (prisma.materialEstudo.create as any).mockResolvedValue({ id: 50 });

      const result = await createEstudoAction(10, formData);

      expect(result.success).toBe(true);
      expect(writeFile).not.toHaveBeenCalled(); 

      expect(prisma.materialEstudo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            provaId: 10,
            titulo: 'Guia Oficial AWS',
            tipo: 'LINK',
            url: 'https://aws.amazon.com/pt/certification/',
            descricao: 'Leitura obrigatória'
          }
        })
      );
    });

    it('deve fazer o upload de um PDF e guardar o caminho correto na base de dados', async () => {
      const formData = new FormData();
      formData.append('titulo', 'Apostila Completa');
      formData.append('tipo', 'PDF');
      
      const fakePDF = new File(['conteudo-falso'], 'apostila.pdf', { type: 'application/pdf' });
      fakePDF.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));
      formData.append('arquivo', 'placeholder'); 
      
      const originalGet = formData.get.bind(formData);
      formData.get = (key) => key === 'arquivo' ? fakePDF : originalGet(key);

      (prisma.materialEstudo.create as any).mockResolvedValue({ id: 51 });

      const result = await createEstudoAction(10, formData);

      if (!result.success) console.error("FALHA NA ACTION DE ESTUDO:", result);

      expect(result.success).toBe(true);
      
      expect(writeFile).toHaveBeenCalled();

      expect(prisma.materialEstudo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            titulo: 'Apostila Completa',
            tipo: 'PDF',
            url: expect.stringMatching(/^\/uploads\/estudos\/\d+-apostila\.pdf$/)
          })
        })
      );
    });

    it('deve falhar se faltar o título ou tipo', async () => {
      const formData = new FormData();
      formData.append('titulo', ''); 
      formData.append('tipo', 'VIDEO');

      const result = await createEstudoAction(10, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('obrigatórios');
    });

  });

  describe('deleteEstudoAction', () => {
    it('deve remover o material se for ADMIN ou INSTRUCTOR', async () => {
      (prisma.materialEstudo.delete as any).mockResolvedValue({ id: 50 });

      const result = await deleteEstudoAction(50, 10);

      expect(result.success).toBe(true);
      expect(prisma.materialEstudo.delete).toHaveBeenCalledWith({ where: { id: 50 } });
    });

    it('deve bloquear a exclusão se for ALUNO', async () => {
      (getCurrentUser as any).mockResolvedValue({ id: 3, role: 'ALUNO' });

      const result = await deleteEstudoAction(50, 10);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Sem permissão');
      expect(prisma.materialEstudo.delete).not.toHaveBeenCalled();
    });
  });

});