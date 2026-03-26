import { describe, it, expect, vi, beforeEach } from 'vitest';
import { iniciarOuRetomarProva, salvarRespostaParcial, finalizarProva } from './actions';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.stubGlobal('crypto', {
  randomUUID: () => 'uuid-falso-1234'
});

describe('Motor de Provas - Server Actions', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    (getCurrentUser as any).mockResolvedValue({ id: 5, role: 'ALUNO' });
  });

  // =============================================
  // iniciarOuRetomarProva
  // =============================================
  describe('iniciarOuRetomarProva', () => {
    it('deve lançar erro se o usuário não estiver autenticado', async () => {
      (getCurrentUser as any).mockResolvedValue(null);

      await expect(iniciarOuRetomarProva(10)).rejects.toThrow('Não autenticado');
    });

    it('deve lançar erro se a prova não existir', async () => {
      (prisma.prova.findUnique as any).mockResolvedValue(null);

      await expect(iniciarOuRetomarProva(999)).rejects.toThrow('Prova não encontrada');
    });

    it('deve RETOMAR a tentativa se o tempo limite ainda NÃO expirou', async () => {
      (prisma.prova.findUnique as any).mockResolvedValue({ id: 10, tempoLimiteMinutos: 60, qtdPerguntasSorteio: 2 });

      const dataInicio = new Date(Date.now() - 10 * 60 * 1000);
      (prisma.tentativaProva.findFirst as any).mockResolvedValue({
        id: 99,
        dataInicio,
        respostas: [{ pergunta: { respostas: [] }, respostasEscolhidas: [] }]
      });

      const result = await iniciarOuRetomarProva(10);

      expect(result.id).toBe(99);
      expect(prisma.tentativaProva.update).not.toHaveBeenCalled();
      expect(prisma.tentativaProva.create).not.toHaveBeenCalled();
    });

    it('deve ENCERRAR uma tentativa expirada e CRIAR uma nova', async () => {
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

    it('deve CRIAR nova tentativa quando não há tentativa aberta', async () => {
      (prisma.prova.findUnique as any).mockResolvedValue({
        id: 10, tempoLimiteMinutos: 60, qtdPerguntasSorteio: 2,
        perguntas: [{ id: 1 }, { id: 2 }]
      });

      (prisma.tentativaProva.findFirst as any).mockResolvedValue(null);
      (prisma.tentativaProva.create as any).mockResolvedValue({
        id: 200,
        respostas: [
          { pergunta: { respostas: [] }, respostasEscolhidas: [] }
        ]
      });

      const result = await iniciarOuRetomarProva(10);

      expect(result.id).toBe(200);
      expect(prisma.tentativaProva.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            usuarioId: 5,
            provaId: 10
          }),
          include: expect.objectContaining({
            respostas: expect.objectContaining({
              include: expect.objectContaining({
                respostasEscolhidas: true
              })
            })
          })
        })
      );
    });
  });

  // =============================================
  // salvarRespostaParcial
  // =============================================
  describe('salvarRespostaParcial', () => {
    it('deve guardar uma única resposta escolhida', async () => {
      (prisma.tentativaResposta.update as any).mockResolvedValue({ id: 1 });

      const result = await salvarRespostaParcial(55, [12]);

      expect(result).toBe(true);
      expect(prisma.tentativaResposta.update).toHaveBeenCalledWith({
        where: { id: 55 },
        data: { respostasEscolhidas: { set: [{ id: 12 }] } }
      });
    });

    it('deve guardar múltiplas respostas escolhidas', async () => {
      (prisma.tentativaResposta.update as any).mockResolvedValue({ id: 1 });

      const result = await salvarRespostaParcial(55, [10, 11, 12]);

      expect(result).toBe(true);
      expect(prisma.tentativaResposta.update).toHaveBeenCalledWith({
        where: { id: 55 },
        data: { respostasEscolhidas: { set: [{ id: 10 }, { id: 11 }, { id: 12 }] } }
      });
    });

    it('deve limpar respostas quando array vazio', async () => {
      (prisma.tentativaResposta.update as any).mockResolvedValue({ id: 1 });

      const result = await salvarRespostaParcial(55, []);

      expect(result).toBe(true);
      expect(prisma.tentativaResposta.update).toHaveBeenCalledWith({
        where: { id: 55 },
        data: { respostasEscolhidas: { set: [] } }
      });
    });
  });

  // =============================================
  // finalizarProva - Resposta Única
  // =============================================
  describe('finalizarProva - Resposta Única', () => {
    it('deve retornar erro se não autenticado', async () => {
      (getCurrentUser as any).mockResolvedValue(null);

      const result = await finalizarProva(10, {});

      expect(result.success).toBe(false);
      expect(result.message).toBe('Não autenticado');
    });

    it('deve retornar erro se não há tentativa em andamento', async () => {
      (prisma.tentativaProva.findFirst as any).mockResolvedValue(null);

      const result = await finalizarProva(10, {});

      expect(result.success).toBe(false);
      expect(result.message).toContain('Nenhuma prova em andamento');
    });

    it('deve REPROVAR o aluno se a nota for menor que o corte', async () => {
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
      expect(prisma.certificado.create).not.toHaveBeenCalled();
    });

    it('deve APROVAR o aluno e GERAR certificado se a nota atingir o corte', async () => {
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

    it('deve dar nota 0 se nenhuma questão for respondida', async () => {
      (prisma.prova.findUnique as any).mockResolvedValue({ id: 10, notaCorte: 7.0 });

      (prisma.tentativaProva.findFirst as any).mockResolvedValue({
        id: 99,
        respostas: [
          { id: 101, pergunta: { id: 1, respostas: [{ id: 11, ehCorreta: true }] } },
          { id: 102, pergunta: { id: 2, respostas: [{ id: 21, ehCorreta: true }] } }
        ]
      });

      const result = await finalizarProva(10, {});

      expect(result.nota).toBe(0);
      expect(result.aprovado).toBe(false);
      expect(prisma.tentativaResposta.update).not.toHaveBeenCalled();
    });
  });

  // =============================================
  // finalizarProva - Múltiplas Respostas Corretas
  // =============================================
  describe('finalizarProva - Múltiplas Respostas Corretas', () => {
    const mockProva = { id: 10, notaCorte: 7.0, validadeMeses: 12 };

    const perguntaMultipla = {
      id: 1,
      respostas: [
        { id: 11, ehCorreta: true },
        { id: 12, ehCorreta: true },
        { id: 13, ehCorreta: false },
        { id: 14, ehCorreta: false }
      ]
    };

    const perguntaUnica = {
      id: 2,
      respostas: [
        { id: 21, ehCorreta: true },
        { id: 22, ehCorreta: false },
        { id: 23, ehCorreta: false }
      ]
    };

    beforeEach(() => {
      (prisma.prova.findUnique as any).mockResolvedValue(mockProva);
    });

    it('deve ACERTAR quando TODAS as corretas são selecionadas (múltipla escolha)', async () => {
      (prisma.tentativaProva.findFirst as any).mockResolvedValue({
        id: 99,
        respostas: [
          { id: 101, pergunta: perguntaMultipla },
          { id: 102, pergunta: perguntaUnica }
        ]
      });

      const result = await finalizarProva(10, {
        1: [11, 12],   // Ambas corretas selecionadas
        2: [21]        // Única correta selecionada
      });

      expect(result.nota).toBe(10.0);
      expect(result.aprovado).toBe(true);
    });

    it('deve ERRAR quando apenas PARTE das corretas são selecionadas', async () => {
      (prisma.tentativaProva.findFirst as any).mockResolvedValue({
        id: 99,
        respostas: [
          { id: 101, pergunta: perguntaMultipla },
          { id: 102, pergunta: perguntaUnica }
        ]
      });

      const result = await finalizarProva(10, {
        1: [11],       // Só uma das duas corretas - ERRADO
        2: [21]        // Correta
      });

      expect(result.nota).toBe(5.0);
      expect(result.aprovado).toBe(false);
    });

    it('deve ERRAR quando seleciona corretas + incorretas juntas', async () => {
      (prisma.tentativaProva.findFirst as any).mockResolvedValue({
        id: 99,
        respostas: [
          { id: 101, pergunta: perguntaMultipla },
          { id: 102, pergunta: perguntaUnica }
        ]
      });

      const result = await finalizarProva(10, {
        1: [11, 12, 13], // Corretas + 1 errada - ERRADO
        2: [21]           // Correta
      });

      expect(result.nota).toBe(5.0);
      expect(result.aprovado).toBe(false);
    });

    it('deve ERRAR quando seleciona apenas respostas incorretas', async () => {
      (prisma.tentativaProva.findFirst as any).mockResolvedValue({
        id: 99,
        respostas: [
          { id: 101, pergunta: perguntaMultipla },
          { id: 102, pergunta: perguntaUnica }
        ]
      });

      const result = await finalizarProva(10, {
        1: [13, 14],  // Só incorretas
        2: [22]       // Incorreta
      });

      expect(result.nota).toBe(0);
      expect(result.aprovado).toBe(false);
    });

    it('deve calcular nota correta em prova mista (questões simples + múltiplas)', async () => {
      const perguntaMultipla2 = {
        id: 3,
        respostas: [
          { id: 31, ehCorreta: true },
          { id: 32, ehCorreta: true },
          { id: 33, ehCorreta: true },
          { id: 34, ehCorreta: false }
        ]
      };

      (prisma.tentativaProva.findFirst as any).mockResolvedValue({
        id: 99,
        respostas: [
          { id: 101, pergunta: perguntaMultipla },  // 2 corretas
          { id: 102, pergunta: perguntaUnica },      // 1 correta
          { id: 103, pergunta: perguntaMultipla2 },  // 3 corretas
        ]
      });

      const result = await finalizarProva(10, {
        1: [11, 12],       // ACERTOU (todas as 2 corretas)
        2: [21],           // ACERTOU (única correta)
        3: [31, 32],       // ERROU (faltou a 33)
      });

      // 2 acertos de 3 = 6.67
      expect(result.nota).toBeCloseTo(6.67, 1);
      expect(result.aprovado).toBe(false);
    });

    it('deve salvar respostas via many-to-many (set) para cada questão', async () => {
      (prisma.tentativaProva.findFirst as any).mockResolvedValue({
        id: 99,
        respostas: [
          { id: 101, pergunta: perguntaMultipla }
        ]
      });

      await finalizarProva(10, { 1: [11, 12] });

      expect(prisma.tentativaResposta.update).toHaveBeenCalledWith({
        where: { id: 101 },
        data: {
          respostasEscolhidas: {
            set: [{ id: 11 }, { id: 12 }]
          }
        }
      });
    });

    it('deve funcionar com questão que tem todas as alternativas corretas', async () => {
      const perguntaTodasCorretas = {
        id: 4,
        respostas: [
          { id: 41, ehCorreta: true },
          { id: 42, ehCorreta: true },
        ]
      };

      (prisma.tentativaProva.findFirst as any).mockResolvedValue({
        id: 99,
        respostas: [
          { id: 101, pergunta: perguntaTodasCorretas }
        ]
      });

      const result = await finalizarProva(10, { 4: [41, 42] });

      expect(result.nota).toBe(10.0);
      expect(result.aprovado).toBe(true);
    });
  });

});
