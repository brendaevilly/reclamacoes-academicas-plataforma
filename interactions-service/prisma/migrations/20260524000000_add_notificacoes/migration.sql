-- TB2: Criação da tabela de notificações
-- Uma notificação pode ser direcionada a um Aluno (usuarioId)
-- OU a uma Universidade (universidadeId).
--
-- Esta migration é IDEMPOTENTE: usa IF NOT EXISTS e blocos DO $$ para
-- foreign keys, permitindo rodar em bancos já parcialmente migrados
-- (ex.: tabela criada por uma tentativa anterior).

-- CreateTable
CREATE TABLE IF NOT EXISTS "notificacoes" (
    "id" SERIAL NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "reclamacaoId" INTEGER,
    "usuarioId" INTEGER,
    "universidadeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (otimização para listagem de não lidas por usuário)
CREATE INDEX IF NOT EXISTS "notificacoes_usuarioId_lida_idx" ON "notificacoes"("usuarioId", "lida");

-- CreateIndex (otimização para listagem de não lidas por universidade)
CREATE INDEX IF NOT EXISTS "notificacoes_universidadeId_lida_idx" ON "notificacoes"("universidadeId", "lida");

-- AddForeignKey (reclamação que originou a notificação)
DO $$ BEGIN
    ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_reclamacaoId_fkey"
        FOREIGN KEY ("reclamacaoId") REFERENCES "reclamacoes"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey (destinatário aluno)
DO $$ BEGIN
    ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_usuarioId_fkey"
        FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey (destinatário universidade)
DO $$ BEGIN
    ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_universidadeId_fkey"
        FOREIGN KEY ("universidadeId") REFERENCES "universidades"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
