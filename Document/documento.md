# Fase 3 — Integração com Banco de Dados e Finalização

**Disciplina:** PWEB2  
**Projeto:** Plataforma de Reclamações Acadêmicas (Ouvidoria Universitária)  
**Arquitetura:** Microsserviços + API Gateway + PostgreSQL

---

## 1. Objetivo da Fase 3

A Fase 3 concentra a **maturação do backend**: sair de uma aplicação
client-side (Fases 1 e 2) para um sistema completo com servidor, banco de
dados persistente, testes automatizados e pipeline de integração contínua.

Os quatro requisitos da fase foram atendidos da seguinte forma:

| Requisito | Solução adotada |
|-----------|-----------------|
| Framework no server-side | **Node.js + Express + Prisma** em todos os microsserviços |
| CI/CD com testes | **GitHub Actions** com Jest + Supertest |
| Execução em servidor | **Docker Compose** (simula ambiente remoto) |
| Integração com banco | **PostgreSQL 15** em container Docker, acessado via Prisma |

---

## 2. Framework no server-side

### O que mudou em relação às fases anteriores

Nas Fases 1 e 2, o frontend (HTML/CSS/JS) era o foco. Na Fase 3, a lógica
de negócio foi centralizada no **backend**, organizada em microsserviços.

### Stack escolhida

| Camada | Tecnologia | Função |
|--------|------------|--------|
| Runtime | Node.js (ES Modules) | Execução dos serviços |
| Framework HTTP | **Express 4** | Rotas, middlewares, controllers |
| ORM | **Prisma 6** | Modelagem, migrations e acesso ao PostgreSQL |
| Validação | **Zod** (users-service) | Validação de entrada nas rotas de auth |
| Segurança | Helmet, rate-limit, bcrypt, JWT | Gateway e users-service |

### Estrutura de cada microsserviço

```
src/
├── routes/        → define os endpoints HTTP
├── controllers/   → recebe a requisição e chama o service
├── services/      → regras de negócio
├── models/        → acesso ao banco via Prisma
├── middlewares/   → autenticação, validação
└── app.js         → configuração do Express
```

### Microsserviços

| Serviço | Porta | Responsabilidade |
|---------|-------|------------------|
| **gateway** | 3000 | Ponto único de entrada; proxy; Helmet; rate limit; serve o frontend |
| **users-service** | 3001 | Cadastro/login de alunos e universidades; avaliações |
| **complaints-service** | 3002 | CRUD de reclamações; feed paginado com filtros |
| **interactions-service** | 3003 | Comentários, likes e notificações |

O frontend continua sendo HTML/CSS/JS estático, mas agora **consome a API
do gateway** em vez de manipular dados localmente.

---

## 3. Integração com Banco de Dados

### Banco escolhido

**PostgreSQL 15**, executado como container Docker. Simula um banco
remoto: os microsserviços acessam via `DATABASE_URL`, sem depender do
PostgreSQL instalado na máquina host.

### Modelagem (8 tabelas)

Definidas no Prisma (`prisma/schema.prisma`):

| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Alunos cadastrados |
| `universidades` | Contas institucionais |
| `categorias` | Tipos de reclamação (Infraestrutura, Ensino, etc.) |
| `reclamacoes` | Reclamações publicadas |
| `comentarios` | Comentários de alunos ou respostas oficiais |
| `likes` | Curtidas em reclamações e comentários |
| `avaliacoes` | Notas que alunos dão às universidades |
| `notificacoes` | Alertas automáticos (nova reclamação, comentário, resposta) |

### Como o banco sobe junto com o sistema

No `docker-compose.yml`:

- O serviço `postgres` sobe primeiro, com **healthcheck** (`pg_isready`).
- Os microsserviços só iniciam depois que o banco está saudável
  (`depends_on: condition: service_healthy`).
- Os dados persistem no volume Docker `postgres-data` (não se perdem ao
  reiniciar os containers).

### Migrations automáticas

Ao subir os containers, os scripts `docker-entrypoint.sh` executam:

```bash
npx prisma migrate deploy   # aplica migrations pendentes
npx prisma db seed          # popula dados iniciais (users-service)
```

Isso garante que o schema do banco esteja sempre sincronizado com o código.

### Conexão entre serviços e banco

```
┌─────────────┐     DATABASE_URL      ┌──────────────┐
│ users-svc   │ ──────────────────────►│              │
│ complaints  │ ──────────────────────►│  PostgreSQL  │
│ interactions│ ──────────────────────►│  (Docker)    │
└─────────────┘                       └──────────────┘
```

Todos compartilham o **mesmo banco**, cada um com seu Prisma Client
limitado às tabelas que usa.

---

## 4. Execução em servidor (Docker)

### Por que Docker?

Docker simula um **servidor remoto** na máquina local: cada componente
roda isolado, com rede interna, variáveis de ambiente e portas expostas —
como aconteceria em produção.

### Como subir o sistema completo

```bash
docker-compose up --build
```

Isso sobe **5 containers**:

| Container | Imagem / Build | Porta exposta |
|-----------|----------------|---------------|
| gateway | `./gateway/Dockerfile` | 3000 |
| users-service | `./users-service/Dockerfile` | 3001 |
| complaints-service | `./complaints-service/Dockerfile` | 3002 |
| interactions-service | `./interactions-service/Dockerfile` | 3003 |
| postgres | `postgres:15` | 5432 |

### Acesso à aplicação

- **Frontend + API:** http://localhost:3000
- O gateway serve as páginas HTML e faz proxy das chamadas `/auth`,
  `/complaints` e `/interactions` para os microsserviços corretos.

### Rede interna

Os serviços se comunicam pela rede Docker `app-network`. O gateway chama
os microsserviços por nome de host (ex.: `http://users-service:3001`), não
por `localhost` — replicando o comportamento de um ambiente distribuído.

### Demonstração para o professor

1. Rodar `docker-compose up --build`
2. Abrir http://localhost:3000
3. Cadastrar um aluno → login → criar reclamação → comentar → ver notificação
4. (Opcional) `docker compose ps` para mostrar os 5 containers ativos
5. (Opcional) `docker compose exec postgres psql -U postgres -d reclamacoes_db -c "\dt"` para listar as tabelas

---

## 5. CI/CD com testes (GitHub Actions)

### O que é CI/CD neste projeto

**CI (Integração Contínua):** a cada push ou pull request no GitHub, um
pipeline automático instala dependências e executa os testes. Se algo
quebrar, o time é avisado antes de integrar o código.

### Ferramentas

| Ferramenta | Uso |
|------------|-----|
| **GitHub Actions** | Orquestra o pipeline (arquivo `.github/workflows/ci.yml`) |
| **Jest** | Framework de testes |
| **Supertest** | Testes HTTP contra o Express (sem subir servidor manualmente) |

### O que o pipeline faz

```yaml
# Dispara em push/PR nas branches main, master e brenda
# Roda 4 jobs em paralelo (um por microsserviço):
#   1. Checkout do código
#   2. Setup Node.js 24
#   3. npm ci (instala dependências)
#   4. npm test (executa Jest)
```

### Cobertura de testes (71 testes no total)

| Serviço | Arquivo | O que testa |
|---------|---------|-------------|
| gateway | `tests/gateway.test.js` | Headers Helmet, rate limiting (429), health check |
| users-service | `tests/auth.test.js` | Cadastro, login, logout, troca de senha, `/auth/me` |
| users-service | `tests/universidade.test.js` | Cadastro/login de universidade |
| users-service | `tests/avaliacao.test.js` | Criar avaliação, média, nota do usuário |
| complaints-service | `tests/complaints.test.js` | Feed, CRUD, autenticação, autorização (dono) |
| interactions-service | `tests/interactions.test.js` | Comentários, notificações, likes, endpoint interno |

Os testes usam **mocks** do Prisma — rodam rápido e **não precisam de
banco** no CI. Isso separa testes de unidade/integração HTTP (CI) da
integração real com PostgreSQL (Docker).

### Como rodar os testes localmente

```bash
cd gateway              && npm ci && npm test
cd users-service        && npm ci && npm test
cd complaints-service   && npm ci && npm test
cd interactions-service && npm ci && npm test
```

Ou, com Docker rodando:

```bash
docker compose exec gateway              npm test
docker compose exec users-service        npm test
docker compose exec complaints-service   npm test
docker compose exec interactions-service npm test
```

### Demonstração para o professor

1. Abrir a aba **Actions** no repositório GitHub
2. Mostrar o workflow **CI** com os 4 jobs (gateway, users, complaints, interactions) em verde
3. (Opcional) Rodar `npm test` localmente em um dos serviços ao vivo

---

## 6. Visão geral da arquitetura (Fase 3)

```
┌──────────────────────────────────────────────────────────────┐
│                        NAVEGADOR                             │
│                   http://localhost:3000                      │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                     GATEWAY (:3000)                          │
│          Helmet · Rate Limit · Proxy · Frontend estático     │
└──────┬─────────────────┬──────────────────┬──────────────────┘
       │                 │                  │
┌──────▼──────┐  ┌───────▼───────┐  ┌──────▼──────────┐
│ users-svc   │  │ complaints-svc │  │ interactions-svc│
│   (:3001)   │  │    (:3002)     │  │     (:3003)     │
│ Express +   │  │ Express +      │  │ Express +       │
│ Prisma      │  │ Prisma         │  │ Prisma          │
└──────┬──────┘  └───────┬────────┘  └──────┬──────────┘
       │                 │                   │
       └─────────────────┼───────────────────┘
                         │
              ┌──────────▼──────────┐
              │   PostgreSQL 15    │
              │   (Docker :5432)   │
              │   volume persistente│
              └───────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS (CI)                       │
│  push/PR → testa gateway + 3 microsserviços (Jest/Supertest) │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Resumo: como cada requisito da Fase 3 foi atendido

### ✅ Ajustar o sistema para framework no server-side

O backend foi reestruturado em **4 microsserviços Express** com camadas
(routes → controllers → services → models/Prisma). O frontend passou a
consumir API REST via gateway.

### ✅ CI/CD com testes

Pipeline **GitHub Actions** (`.github/workflows/ci.yml`) executa **71
testes** automaticamente em cada push/PR, cobrindo todos os microsserviços.

### ✅ Executar em servidor (Docker)

`docker-compose.yml` orquestra 5 containers (4 serviços + banco),
simulando deploy remoto com rede interna, volumes e healthchecks.

### ✅ Integração com banco de dados (Docker)

**PostgreSQL 15** em container, acessado via **Prisma ORM** com 8
tabelas, migrations automáticas no boot e persistência em volume Docker.

---

## 8. Roteiro sugerido para a apresentação (5–10 min)

| Ordem | O que mostrar | Tempo |
|-------|---------------|-------|
| 1 | Explicar a arquitetura (diagrama da seção 6) | 1–2 min |
| 2 | `docker-compose up --build` + abrir http://localhost:3000 | 2 min |
| 3 | Fluxo rápido: login → criar reclamação → comentar | 2 min |
| 4 | `docker compose ps` e/ou listar tabelas no Postgres | 1 min |
| 5 | Aba Actions no GitHub com CI verde | 1–2 min |
| 6 | Mencionar testes locais (`npm test`) e cobertura | 1 min |

---

## 9. Arquivos-chave para referência

| Arquivo | Papel na Fase 3 |
|---------|-----------------|
| `docker-compose.yml` | Orquestra todos os containers |
| `.env` | Variáveis (portas, `DATABASE_URL`, `JWT_SECRET`) |
| `*/prisma/schema.prisma` | Modelagem do banco |
| `*/docker-entrypoint.sh` | Migrations automáticas |
| `.github/workflows/ci.yml` | Pipeline CI/CD |
| `*/tests/*.test.js` | Testes automatizados |
| `Document/documentacao.md` | Documentação técnica completa |
