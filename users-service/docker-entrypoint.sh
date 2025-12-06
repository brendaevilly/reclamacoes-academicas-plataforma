#!/bin/sh
set -e

echo "Aguardando banco de dados..."
sleep 5

echo "Executando migrations do Prisma..."
npx prisma migrate deploy

echo "Executando seed (se necessário)..."
npx prisma db seed || true

echo "Iniciando aplicação..."
exec "$@"
