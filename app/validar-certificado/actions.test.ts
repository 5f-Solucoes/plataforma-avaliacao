import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validarCertificadoAction } from './actions';
import { prisma } from '@/lib/prisma';

describe('Validação de Certificado - Server Actions', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validação de formato UUID', () => {
    it('deve rejeitar código vazio', async () => {
      const result = await validarCertificadoAction('');
      expect(result.success).toBe(false);
      expect(result.message).toContain('inválido');
    });

    it('deve rejeitar código com formato incorreto', async () => {
      const result = await validarCertificadoAction('abc123');
      expect(result.success).toBe(false);
      expect(result.message).toContain('inválido');
    });

    it('deve rejeitar código com caracteres especiais', async () => {
      const result = await validarCertificadoAction('550e8400-e29b-41d4-a716-<script>alert(1)</script>');
      expect(result.success).toBe(false);
      expect(result.message).toContain('inválido');
    });

    it('deve rejeitar UUID parcial', async () => {
      const result = await validarCertificadoAction('550e8400-e29b-41d4');
      expect(result.success).toBe(false);
      expect(result.message).toContain('inválido');
    });

    it('deve aceitar UUID válido com letras minúsculas', async () => {
      (prisma.certificado.findUnique as any).mockResolvedValue(null);

      const result = await validarCertificadoAction('550e8400-e29b-41d4-a716-446655440000');
      // Não encontra no banco, mas o formato é válido
      expect(result.message).not.toContain('inválido');
    });

    it('deve aceitar UUID válido com letras maiúsculas', async () => {
      (prisma.certificado.findUnique as any).mockResolvedValue(null);

      const result = await validarCertificadoAction('550E8400-E29B-41D4-A716-446655440000');
      expect(result.message).not.toContain('inválido');
    });

    it('deve aceitar UUID com espaços nas pontas (trim)', async () => {
      (prisma.certificado.findUnique as any).mockResolvedValue(null);

      const result = await validarCertificadoAction('  550e8400-e29b-41d4-a716-446655440000  ');
      expect(result.message).not.toContain('inválido');
    });
  });

  describe('busca no banco', () => {
    it('deve retornar erro se certificado não for encontrado', async () => {
      (prisma.certificado.findUnique as any).mockResolvedValue(null);

      const result = await validarCertificadoAction('550e8400-e29b-41d4-a716-446655440000');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Nenhum certificado');
    });

    it('deve retornar dados do certificado VÁLIDO (dentro da validade)', async () => {
      const futuro = new Date();
      futuro.setMonth(futuro.getMonth() + 6);

      (prisma.certificado.findUnique as any).mockResolvedValue({
        codigoAutenticacao: '550e8400-e29b-41d4-a716-446655440000',
        dataEmissao: new Date('2025-06-01'),
        dataValidade: futuro,
        usuario: { nome: 'João Silva' },
        tentativa: {
          notaFinal: 8.5,
          prova: {
            nome: 'AWS Cloud Practitioner',
            fabricante: { nome: 'Amazon' }
          }
        }
      });

      const result = await validarCertificadoAction('550e8400-e29b-41d4-a716-446655440000');

      expect(result.success).toBe(true);
      expect(result.certificado).toBeDefined();
      expect(result.certificado!.nomeUsuario).toBe('João Silva');
      expect(result.certificado!.nomeProva).toBe('AWS Cloud Practitioner');
      expect(result.certificado!.fabricante).toBe('Amazon');
      expect(result.certificado!.notaFinal).toBe(8.5);
      expect(result.certificado!.valido).toBe(true);
    });

    it('deve retornar certificado EXPIRADO quando data de validade passou', async () => {
      const passado = new Date();
      passado.setMonth(passado.getMonth() - 3);

      (prisma.certificado.findUnique as any).mockResolvedValue({
        codigoAutenticacao: '550e8400-e29b-41d4-a716-446655440000',
        dataEmissao: new Date('2024-01-01'),
        dataValidade: passado,
        usuario: { nome: 'Maria Souza' },
        tentativa: {
          notaFinal: 9.0,
          prova: {
            nome: 'Azure Fundamentals',
            fabricante: { nome: 'Microsoft' }
          }
        }
      });

      const result = await validarCertificadoAction('550e8400-e29b-41d4-a716-446655440000');

      expect(result.success).toBe(true);
      expect(result.certificado!.valido).toBe(false);
      expect(result.certificado!.nomeUsuario).toBe('Maria Souza');
    });

    it('deve considerar válido se dataValidade for null (sem expiração)', async () => {
      (prisma.certificado.findUnique as any).mockResolvedValue({
        codigoAutenticacao: '550e8400-e29b-41d4-a716-446655440000',
        dataEmissao: new Date('2025-01-01'),
        dataValidade: null,
        usuario: { nome: 'Carlos Lima' },
        tentativa: {
          notaFinal: 7.0,
          prova: {
            nome: 'Prova Interna',
            fabricante: null
          }
        }
      });

      const result = await validarCertificadoAction('550e8400-e29b-41d4-a716-446655440000');

      expect(result.success).toBe(true);
      expect(result.certificado!.valido).toBe(true);
      expect(result.certificado!.fabricante).toBeNull();
      expect(result.certificado!.dataValidade).toBeNull();
    });
  });

});
