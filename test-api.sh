#!/bin/bash

echo "=== Teste de Integração do Sistema de Reclamações ==="
echo ""

API_URL="http://localhost:3000"

echo "1. Testando Health Check do Gateway..."
curl -s "$API_URL/health" | jq '.' || echo "Erro: Gateway não está respondendo"
echo ""

echo "2. Cadastrando um aluno..."
ALUNO_RESPONSE=$(curl -s -X POST "$API_URL/auth/cadastro" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@teste.com",
    "senha": "senha123"
  }')
echo "$ALUNO_RESPONSE" | jq '.'
echo ""

echo "3. Fazendo login do aluno..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@teste.com",
    "senha": "senha123"
  }')
echo "$LOGIN_RESPONSE" | jq '.'

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
echo "Token obtido: $TOKEN"
echo ""

echo "4. Cadastrando uma universidade..."
UNIV_RESPONSE=$(curl -s -X POST "$API_URL/universidades/cadastro" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Universidade Federal de Teste",
    "email": "contato@uft.br",
    "senha": "senha123",
    "cnpj": "12345678000199",
    "descricao": "Universidade para testes"
  }')
echo "$UNIV_RESPONSE" | jq '.'
UNIV_ID=$(echo "$UNIV_RESPONSE" | jq -r '.id')
echo ""

echo "5. Criando uma reclamação..."
COMPLAINT_RESPONSE=$(curl -s -X POST "$API_URL/complaints" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"titulo\": \"Problema na biblioteca\",
    \"descricao\": \"A biblioteca está com ar condicionado quebrado\",
    \"categoria\": \"Infraestrutura\",
    \"universidade_id\": $UNIV_ID
  }")
echo "$COMPLAINT_RESPONSE" | jq '.'
COMPLAINT_ID=$(echo "$COMPLAINT_RESPONSE" | jq -r '.data.id')
echo ""

echo "6. Listando reclamações (feed)..."
curl -s "$API_URL/complaints/feed?page=1&limit=5" | jq '.'
echo ""

echo "7. Criando um comentário..."
COMMENT_RESPONSE=$(curl -s -X POST "$API_URL/interactions/comentarios" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"texto\": \"Eu também estou com esse problema!\",
    \"reclamacaoId\": $COMPLAINT_ID
  }")
echo "$COMMENT_RESPONSE" | jq '.'
echo ""

echo "8. Listando comentários da reclamação..."
curl -s "$API_URL/interactions/comentarios/reclamacao/$COMPLAINT_ID" | jq '.'
echo ""

echo "9. Listando notificações..."
curl -s "$API_URL/interactions/notificacoes" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

echo "=== Testes Concluídos ==="
