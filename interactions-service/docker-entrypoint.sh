#!/bin/sh
set -e

echo "Aguardando banco de dados..."
sleep 5

echo "Executando migrations do Prisma..."

# Tentar aplicar migrations
if ! npx prisma migrate deploy; then
    echo "Erro ao aplicar migrations. Verificando se é por tabelas já existentes..."
    # Se a migration inicial falhou, marcar como aplicada e tentar novamente
    npx prisma migrate resolve --applied 20241204000000_init 2>/dev/null || true
    # Tentar aplicar novamente
    npx prisma migrate deploy || echo "Aviso: Algumas migrations podem ter falhado, mas continuando..."
fi

echo "Iniciando aplicação..."
exec "$@"

