import { describe, it, expect, vi, beforeEach } from 'vitest';
import { iniciarOuRetomarProva, salvarRespostaParcial, finalizarProva } from './actions';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));

vi.stubGlobal('crypto', {
  randomUUID: () => 'uuid-falso-1234'
});

describe('Motor de Provas - Server Actions', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUser as any).mockResolvedValue({ id: 5, role: 'ALUNO' });
  });

  describe('iniciarOuRetomarProva', () => {
    it('deve RETOMAR a tentativa se o tempo limite ainda NÃO expirou', async () => {
      (prisma.prova.findUnique as any).mockResolvedValue({ id: 10, tempoLimiteMinutos: 60, qtdPerguntasSorteio: 2 });
      
      const dataInicio = new Date(Date.now() - 10 * 60 * 1000); 
      (prisma.tentativaProva.findFirst as any).mockResolvedValue({
        id: 99,
        dataInicio,
        respostas: [{ pergunta: { respostas: [] } }]
      });

      const result = await iniciarOuRetomarProva(10);

      expect(result.id).toBe(99);
      expect(prisma.tentativaProva.update).not.toHaveBeenCalled(); 
      expect(prisma.tentativaProva.create).not.toHaveBeenCalled(); 
    });

    it('deve ENCERRAR uma tentativa fantasma (expirada) e CRIAR uma nova', async () => {
      (prisma.prova.findUnique as any).mockResolvedValue({ 
        id: 10, tempoLimiteMinutos: 60, qtdPerguntasSorteio: 2,
        perguntas: [{ id: 1 }, { id: 2 }, { id: 3 }] 
      });
      
      const dataInicio = new Date(Date.now() - 120 * 60 * 1000); 
      (prisma.tentativaProva.findFirst as any).mockResolvedValue({
        id: 99,
        dataInicio,
        respostas: []
      });

      (prisma.tentativaProva.create as any).mockResolvedValue({ id: 100, respostas: [] });

      const result = await iniciarOuRetomarProva(10);

      expect(prisma.tentativaProva.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 99 },
          data: expect.objectContaining({ notaFinal: 0, aprovado: false })
        })
      );

      expect(result.id).toBe(100);
      expect(prisma.tentativaProva.create).toHaveBeenCalled();
    });
  });

  describe('salvarRespostaParcial', () => {
    it('deve guardar a resposta escolhida imediatamente', async () => {
      (prisma.tentativaResposta.update as any).mockResolvedValue({ id: 1 });

      const result = await salvarRespostaParcial(55, [12]);

      expect(result).toBe(true);
      expect(prisma.tentativaResposta.update).toHaveBeenCalledWith({
        where: { id: 55 },
        data: { respostasEscolhidas: { set: [{ id: 12 }] } }
      });
    });
  });

  describe('finalizarProva', () => {
    it('deve REPROVAR o aluno e NÃO gerar certificado se a nota for menor que o corte', async () => {
      (prisma.prova.findUnique as any).mockResolvedValue({ id: 10, notaCorte: 7.0 });

      (prisma.tentativaProva.findFirst as any).mockResolvedValue({
        id: 99,
        respostas: [
          { id: 101, pergunta: { id: 1, respostas: [{ id: 11, ehCorreta: true }, { id: 12, ehCorreta: false }] } },
          { id: 102, pergunta: { id: 2, respostas: [{ id: 21, ehCorreta: true }, { id: 22, ehCorreta: false }] } }
        ]
      });

      const result = await finalizarProva(10, { 1: [12], 2: [21] });

      expect(result.success).toBe(true);
      expect(result.nota).toBe(5.0);
      expect(result.aprovado).toBe(false);

      expect(prisma.tentativaProva.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 99 },
          data: expect.objectContaining({ notaFinal: 5.0, aprovado: false })
        })
      );

      expect(prisma.certificado.create).not.toHaveBeenCalled();
    });

    it('deve APROVAR o aluno e GERAR o certificado se a nota atingir o corte', async () => {
      (prisma.prova.findUnique as any).mockResolvedValue({ id: 10, notaCorte: 7.0, validadeMeses: 12 });

      (prisma.tentativaProva.findFirst as any).mockResolvedValue({
        id: 99,
        respostas: [
          { id: 101, pergunta: { id: 1, respostas: [{ id: 11, ehCorreta: true }, { id: 12, ehCorreta: false }] } },
          { id: 102, pergunta: { id: 2, respostas: [{ id: 21, ehCorreta: true }, { id: 22, ehCorreta: false }] } }
        ]
      });

      const result = await finalizarProva(10, { 1: [11], 2: [21] });

      expect(result.success).toBe(true);
      expect(result.nota).toBe(10.0);
      expect(result.aprovado).toBe(true);

      expect(prisma.tentativaProva.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ notaFinal: 10.0, aprovado: true })
        })
      );

      expect(prisma.certificado.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            usuarioId: 5,
            tentativaId: 99,
            codigoAutenticacao: 'uuid-falso-1234'
          })
        })
      );
    });
  });

});