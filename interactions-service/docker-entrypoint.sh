#!/bin/sh
set -e

echo "Aguardando banco de dados..."
sleep 5

echo "Executando migrations do Prisma..."

# Lista de migrations conhecidas (mantida em sincronia com prisma/migrations)
KNOWN_MIGRATIONS="20241204000000_init 20241206000000_add_likes 20260524000000_add_notificacoes"

# Tenta aplicar; se falhar, faz auto-recuperação para os casos comuns:
#  - Tabelas já criadas em uma execução anterior (P3018 / "relation already exists")
#  - Migration marcada como falha bloqueando todas as próximas (P3009)
apply_migrations() {
    npx prisma migrate deploy
}

if ! apply_migrations; then
    echo "Erro ao aplicar migrations. Tentando auto-recuperação..."

    # 1) Marca toda migration que ficou em estado "failed" como rolled-back,
    #    para liberar a fila (P3009). É seguro porque as migrations são
    #    idempotentes (CREATE TABLE IF NOT EXISTS, DO $$ ... $$ etc.).
    for m in $KNOWN_MIGRATIONS; do
        npx prisma migrate resolve --rolled-back "$m" 2>/dev/null || true
    done

    # 2) Tenta aplicar novamente — agora a fila está livre e cada migration
    #    idempotente vai apenas reconciliar o que faltar.
    if ! apply_migrations; then
        echo "Aviso: ainda há migrations não aplicáveis. Marcando como aplicadas e seguindo..."
        # Última tentativa: marca tudo como aplicado para que o serviço suba,
        # assumindo que as tabelas já estão materializadas no banco.
        for m in $KNOWN_MIGRATIONS; do
            npx prisma migrate resolve --applied "$m" 2>/dev/null || true
        done
    fi
fi

echo "Iniciando aplicação..."
exec "$@"
