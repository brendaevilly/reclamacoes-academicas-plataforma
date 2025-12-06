# Sistema de Reclamações - Microsserviços

Sistema completo de gerenciamento de reclamações universitárias com arquitetura de microsserviços.

## 🏗️ Arquitetura

O sistema é composto por:

- **Gateway** (porta 3000): Ponto de entrada único para todas as requisições
- **Users Service** (porta 3001): Gerenciamento de usuários (alunos) e universidades
- **Complaints Service** (porta 3002): Gerenciamento de reclamações
- **Interactions Service** (porta 3003): Comentários e notificações
- **PostgreSQL**: Banco de dados compartilhado entre todos os serviços
- **Frontend**: Interface web monolítica

## 🗄️ Banco de Dados

Todos os microsserviços compartilham um único banco PostgreSQL (`reclamacoes_db`) com as seguintes tabelas:

- `usuarios` - Alunos do sistema
- `universidades` - Instituições cadastradas
- `categorias` - Categorias de reclamações
- `reclamacoes` - Reclamações registradas
- `comentarios` - Comentários nas reclamações
- `notificacoes` - Notificações para usuários e universidades

## 🚀 Como Executar

### Pré-requisitos
- Docker
- Docker Compose

### Iniciar o sistema

```bash
docker-compose up --build
```

Isso irá:
1. Criar o banco de dados PostgreSQL
2. Executar as migrations do Prisma (criando todas as tabelas)
3. Popular o banco com categorias padrão
4. Iniciar todos os microsserviços
5. Iniciar o gateway

### Acessar o sistema

- **Frontend**: Abra os arquivos HTML em `/frontend` no navegador
- **API Gateway**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 📡 Endpoints da API

### Autenticação (via Gateway)

**Cadastro de Aluno**
```
POST http://localhost:3000/auth/cadastro
Body: { "nome": "João", "email": "joao@email.com", "senha": "123456" }
```

**Login de Aluno**
```
POST http://localhost:3000/auth/login
Body: { "email": "joao@email.com", "senha": "123456" }
Response: { "user": {...}, "token": "..." }
```

**Cadastro de Universidade**
```
POST http://localhost:3000/universidades/cadastro
Body: { 
  "nome": "Universidade Federal",
  "email": "contato@univ.br",
  "senha": "123456",
  "cnpj": "12345678000199",
  "descricao": "Descrição da universidade"
}
```

**Login de Universidade**
```
POST http://localhost:3000/universidades/login
Body: { "email": "contato@univ.br", "senha": "123456" }
```

### Reclamações

**Listar Reclamações (Feed)**
```
GET http://localhost:3000/complaints/feed?page=1&limit=10&category=Infraestrutura
```

**Criar Reclamação** (requer autenticação)
```
POST http://localhost:3000/complaints
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "titulo": "Problema no banheiro",
  "descricao": "Descrição detalhada",
  "categoria": "Infraestrutura",
  "universidade_id": 1
}
```

**Buscar Reclamação por ID**
```
GET http://localhost:3000/complaints/:id
```

**Atualizar Reclamação** (requer autenticação)
```
PUT http://localhost:3000/complaints/:id
Headers: { "Authorization": "Bearer <token>" }
Body: { "titulo": "Novo título", "status": "Em Análise" }
```

**Deletar Reclamação** (requer autenticação)
```
DELETE http://localhost:3000/complaints/:id
Headers: { "Authorization": "Bearer <token>" }
```

### Interações (Comentários e Notificações)

**Criar Comentário** (requer autenticação)
```
POST http://localhost:3000/interactions/comentarios
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "texto": "Meu comentário",
  "reclamacaoId": 1
}
```

**Listar Comentários de uma Reclamação**
```
GET http://localhost:3000/interactions/comentarios/reclamacao/:reclamacaoId
```

**Atualizar Comentário** (requer autenticação)
```
PUT http://localhost:3000/interactions/comentarios/:id
Headers: { "Authorization": "Bearer <token>" }
Body: { "texto": "Texto atualizado" }
```

**Deletar Comentário** (requer autenticação)
```
DELETE http://localhost:3000/interactions/comentarios/:id
Headers: { "Authorization": "Bearer <token>" }
```

**Listar Notificações** (requer autenticação)
```
GET http://localhost:3000/interactions/notificacoes?lida=false
Headers: { "Authorization": "Bearer <token>" }
```

**Marcar Notificação como Lida** (requer autenticação)
```
PATCH http://localhost:3000/interactions/notificacoes/:id/read
Headers: { "Authorization": "Bearer <token>" }
```

**Marcar Todas as Notificações como Lidas** (requer autenticação)
```
PATCH http://localhost:3000/interactions/notificacoes/read-all
Headers: { "Authorization": "Bearer <token>" }
```

## 🔧 Tecnologias Utilizadas

- **Backend**: Node.js, Express
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT
- **Containerização**: Docker, Docker Compose
- **Frontend**: HTML, CSS, JavaScript (Vanilla)

## 📝 Observações Importantes

1. **Banco Compartilhado**: Todos os microsserviços usam o mesmo banco de dados PostgreSQL
2. **Migrations**: Gerenciadas pelo Prisma no `users-service` e compartilhadas via links simbólicos
3. **JWT Secret**: Configurado em `.env` e deve ser o mesmo em todos os serviços
4. **CORS**: Habilitado em todos os serviços para permitir requisições do frontend
5. **Autenticação**: O token JWT contém `id`, `email` e `tipo` (aluno ou universidade)

## 🐛 Troubleshooting

**Erro de conexão com o banco:**
```bash
# Verificar se o PostgreSQL está rodando
docker ps | grep postgres

# Ver logs do banco
docker logs postgres
```

**Erro nas migrations:**
```bash
# Entrar no container do users-service
docker exec -it users-service sh

# Executar migrations manualmente
npx prisma migrate deploy
```

**Testar comunicação entre containers:**
```bash
# Entrar em um container
docker exec -it gateway sh

# Testar ping para outro serviço
ping users-service
```

## 📦 Estrutura de Pastas

```
.
├── gateway/              # API Gateway
├── users-service/        # Serviço de usuários
│   └── prisma/          # Schema e migrations (compartilhado)
├── complaints-service/   # Serviço de reclamações
├── interactions-service/ # Serviço de interações
├── frontend/            # Interface web
├── docker-compose.yml   # Orquestração dos containers
└── .env                 # Variáveis de ambiente
```

## 🎯 Próximos Passos

- [ ] Implementar paginação no frontend
- [ ] Adicionar upload de imagens nas reclamações
- [ ] Implementar sistema de votos/apoios
- [ ] Adicionar notificações em tempo real (WebSocket)
- [ ] Implementar busca avançada de reclamações
- [ ] Adicionar testes automatizados
- [ ] Implementar CI/CD
