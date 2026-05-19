#!/bin/sh
set -e

echo "Aguardando banco de dados..."
sleep 5

echo "Executando migrations do Prisma..."
# Se houver migration falha, resolver primeiro
if ! npx prisma migrate deploy; then
    echo "Erro ao aplicar migrations. Verificando migrations falhas..."
    # Tentar resolver migration falha se existir
    npx prisma migrate resolve --rolled-back 20241204000000_init 2>/dev/null || true
    # Tentar aplicar novamente
    npx prisma migrate deploy || echo "Aviso: Algumas migrations podem ter falhado, mas continuando..."
fi

echo "Executando seed (se necessário)..."
npx prisma db seed || true

echo "Iniciando aplicação..."
exec "$@"
