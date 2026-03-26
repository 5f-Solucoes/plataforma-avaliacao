-- AlterTable: Remove single answer FK from tentativas_respostas
ALTER TABLE "tentativas_respostas" DROP CONSTRAINT IF EXISTS "tentativas_respostas_resposta_escolhida_id_fkey";
ALTER TABLE "tentativas_respostas" DROP COLUMN IF EXISTS "resposta_escolhida_id";

-- CreateTable: Junction table for many-to-many (TentativaResposta <-> Resposta)
CREATE TABLE IF NOT EXISTS "_RespostaToTentativaResposta" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_RespostaToTentativaResposta_A_fkey" FOREIGN KEY ("A") REFERENCES "respostas"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RespostaToTentativaResposta_B_fkey" FOREIGN KEY ("B") REFERENCES "tentativas_respostas"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "_RespostaToTentativaResposta_AB_unique" ON "_RespostaToTentativaResposta"("A", "B");
CREATE INDEX IF NOT EXISTS "_RespostaToTentativaResposta_B_index" ON "_RespostaToTentativaResposta"("B");
