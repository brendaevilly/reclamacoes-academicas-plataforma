-- CreateTable
CREATE TABLE "likes" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "reclamacaoId" INTEGER,
    "comentarioId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "likes_usuarioId_reclamacaoId_key" ON "likes"("usuarioId", "reclamacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_usuarioId_comentarioId_key" ON "likes"("usuarioId", "comentarioId");

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_reclamacaoId_fkey" FOREIGN KEY ("reclamacaoId") REFERENCES "reclamacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_comentarioId_fkey" FOREIGN KEY ("comentarioId") REFERENCES "comentarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

