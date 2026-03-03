// types/index.ts

export interface Resposta {
  id: number;
  texto: string;
}

export interface Pergunta {
  id: number;
  enunciado: string;
  imagemUrl?: string;
  respostas: Resposta[];
}

export interface TentativaState {
  respostasSelecionadas: Record<number, number>; 
  perguntaAtual: number;
}