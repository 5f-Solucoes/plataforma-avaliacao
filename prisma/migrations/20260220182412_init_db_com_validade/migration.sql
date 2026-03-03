-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "email" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabricantes" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "site" TEXT,
    "area_atuacao" TEXT,

    CONSTRAINT "fabricantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provas" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "tempo_limite_minutos" INTEGER NOT NULL,
    "qtd_perguntas_sorteio" INTEGER NOT NULL DEFAULT 10,
    "nota_corte" DECIMAL(5,2) NOT NULL,
    "validade_meses" INTEGER DEFAULT 12,
    "fabricante_id" INTEGER,

    CONSTRAINT "provas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perguntas" (
    "id" SERIAL NOT NULL,
    "enunciado" TEXT NOT NULL,
    "imagem_url" TEXT,
    "nivel_dificuldade" TEXT,
    "prova_id" INTEGER NOT NULL,

    CONSTRAINT "perguntas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respostas" (
    "id" SERIAL NOT NULL,
    "texto_alternativa" TEXT NOT NULL,
    "eh_correta" BOOLEAN NOT NULL,
    "pergunta_id" INTEGER NOT NULL,

    CONSTRAINT "respostas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tentativas_prova" (
    "id" SERIAL NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_fim" TIMESTAMP(3),
    "nota_final" DECIMAL(5,2),
    "aprovado" BOOLEAN,
    "usuario_id" INTEGER NOT NULL,
    "prova_id" INTEGER NOT NULL,

    CONSTRAINT "tentativas_prova_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tentativas_respostas" (
    "id" SERIAL NOT NULL,
    "tentativa_id" INTEGER NOT NULL,
    "pergunta_id" INTEGER NOT NULL,
    "resposta_escolhida_id" INTEGER,

    CONSTRAINT "tentativas_respostas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificados" (
    "id" SERIAL NOT NULL,
    "codigo_autenticacao" TEXT NOT NULL,
    "data_emissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_validade" TIMESTAMP(3),
    "caminho_pdf" TEXT,
    "usuario_id" INTEGER NOT NULL,
    "tentativa_id" INTEGER NOT NULL,

    CONSTRAINT "certificados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- CreateIndex
CREATE UNIQUE INDEX "certificados_codigo_autenticacao_key" ON "certificados"("codigo_autenticacao");

-- CreateIndex
CREATE UNIQUE INDEX "certificados_tentativa_id_key" ON "certificados"("tentativa_id");

-- AddForeignKey
ALTER TABLE "provas" ADD CONSTRAINT "provas_fabricante_id_fkey" FOREIGN KEY ("fabricante_id") REFERENCES "fabricantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perguntas" ADD CONSTRAINT "perguntas_prova_id_fkey" FOREIGN KEY ("prova_id") REFERENCES "provas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respostas" ADD CONSTRAINT "respostas_pergunta_id_fkey" FOREIGN KEY ("pergunta_id") REFERENCES "perguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentativas_prova" ADD CONSTRAINT "tentativas_prova_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentativas_prova" ADD CONSTRAINT "tentativas_prova_prova_id_fkey" FOREIGN KEY ("prova_id") REFERENCES "provas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentativas_respostas" ADD CONSTRAINT "tentativas_respostas_tentativa_id_fkey" FOREIGN KEY ("tentativa_id") REFERENCES "tentativas_prova"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentativas_respostas" ADD CONSTRAINT "tentativas_respostas_pergunta_id_fkey" FOREIGN KEY ("pergunta_id") REFERENCES "perguntas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentativas_respostas" ADD CONSTRAINT "tentativas_respostas_resposta_escolhida_id_fkey" FOREIGN KEY ("resposta_escolhida_id") REFERENCES "respostas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_tentativa_id_fkey" FOREIGN KEY ("tentativa_id") REFERENCES "tentativas_prova"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
