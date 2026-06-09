# Documentação da Plataforma de Reclamações Acadêmicas

> Disciplina: **PWEB2**
> Projeto: **Ouvidoria Universitária**
> Arquitetura: microsserviços + gateway + frontend estático
> Banco: **PostgreSQL** (compartilhado entre microsserviços), executado em Docker
> Stack server-side: **Node.js + Express + Prisma**
> Stack client-side: **HTML5 + CSS3 + Bootstrap 5 + JavaScript ES Modules**

---

## 1. Visão Geral

A Ouvidoria Universitária permite que **alunos** registrem reclamações públicas
sobre suas universidades (infraestrutura, atendimento, ensino etc.), comentem,
deem like, avaliem instituições e recebam notificações quando suas reclamações
forem comentadas ou respondidas. As **universidades** têm sua própria conta e
podem responder oficialmente às reclamações que recebem.

A aplicação é dividida em quatro componentes:

1. **Gateway** (porta `3000`) — porta de entrada única. Faz proxy autenticado
   para os microsserviços, aplica `Helmet`, `Rate Limiting` e serve o
   frontend estático.
2. **users-service** (porta `3001`) — cadastro/login de alunos e
   universidades, JWT em cookie HttpOnly, troca de senha com validação.
3. **complaints-service** (porta `3002`) — CRUD de reclamações, feed
   paginado/filtros, autorização "dono do recurso" e auth opcional para
   personalizar `user_liked` por usuário logado.
4. **interactions-service** (porta `3003`) — comentários, likes e
   **notificações** (TB2/TB3).

> Observação: o frontend é **servido pelo próprio gateway** via
> `express.static`, e o diretório `./frontend` é montado como volume
> `read-only` no container (`./frontend:/frontend:ro` em
> `docker-compose.yml`). Isso permite alterar HTML/CSS/JS no host sem
> precisar rebuildar o container.

---

## 2. Estrutura de Pastas

```
reclamacoes-academicas-plataforma-main/
├── docker-compose.yml
├── README.md
├── Document/
│   └── documentacao.md        <- este arquivo
│
 ├── gateway/
│   ├── src/
│   │   ├── routes/index.js
│   │   ├── services/proxyService.js
│   │   └── app.js              (helmet, rate limit, cookie-parser, static frontend)
│   ├── tests/                  (Jest + Supertest)
│   ├── jest.config.js
│   └── server.js
│
 ├── users-service/
│   ├── src/
│   │   ├── routes/userRoutes.js, universidadeRoutes.js, ...
│   │   ├── controllers/userController.js, universidadeController.js
│   │   ├── services/userService.js
│   │   ├── middlewares/auth.js (lê cookie HttpOnly OU header Bearer)
│   │   ├── validators/userValidator.js
│   │   ├── models/User.js, Universidade.js, Avaliacao.js
│   │   └── app.js
│   ├── prisma/schema.prisma, migrations/
│   ├── tests/                  (cadastro, login, logout, troca de senha)
│   └── server.js
│
 ├── complaints-service/
│   ├── src/
│   │   ├── controllers/complaintController.js
│   │   ├── services/complaintService.js, notificationHelper.js
│   │   ├── models/Complaint.js
│   │   ├── middleware/authMiddleware.js, optionalAuthMiddleware.js
│   │   └── app.js
│   ├── prisma/schema.prisma, migrations/
│   ├── tests/                  (Jest + Supertest)
│   ├── jest.config.js
│   └── server.js
│
 ├── interactions-service/
│   ├── src/
│   │   ├── controllers/interactionController.js
│   │   ├── services/interactionService.js, notificationHelper.js
│   │   ├── models/Comentario.js, Like.js, Notificacao.js
│   │   ├── middlewares/authMiddleware.js, optionalAuthMiddleware.js
│   │   └── app.js
│   ├── prisma/schema.prisma, migrations/  (inclui add_notificacoes)
│   ├── docker-entrypoint.sh    (roda prisma migrate deploy ao subir)
│   ├── tests/                  (Jest + Supertest)
│   ├── jest.config.js
│   └── server.js
│
 ├── .github/
│   └── workflows/ci.yml        (GitHub Actions — testes automáticos)
│
 └── frontend/
    ├── pages/                  (HTML estático servido pelo gateway)
    ├── scripts/                (api-config.js, form-validation.js, ...)
    └── styles/                 (form-validation.css, feed.css, ...)
```

---

## 3. Como rodar

```bash
docker-compose up --build
```

- Gateway/Frontend: <http://localhost:3000>
- Postgres exposto na porta definida em `.env`
- Migrations são aplicadas automaticamente pelo `docker-entrypoint.sh` do
  `interactions-service` (que possui o schema mais completo do banco
  compartilhado).

### Rodar os testes

Os testes usam **Jest + Supertest** com mocks de banco de dados — não é
necessário subir o PostgreSQL para executá-los.

**Localmente** (dentro de cada pasta do microsserviço):

```bash
cd gateway              && npm ci && npm test
cd users-service        && npm ci && npm test
cd complaints-service   && npm ci && npm test
cd interactions-service && npm ci && npm test
```

**Via Docker** (com os containers em execução):

```bash
docker compose exec gateway              npm test
docker compose exec users-service        npm test
docker compose exec complaints-service   npm test
docker compose exec interactions-service npm test
```

### CI/CD (GitHub Actions)

O workflow `.github/workflows/ci.yml` roda automaticamente em **push** e
**pull request** nas branches `main` e `master`. Ele executa os testes dos
quatro microsserviços em paralelo (matrix), usando Node.js 20.

---

## 4. Modelo de Dados (Prisma)

Todos os microsserviços compartilham o mesmo banco PostgreSQL. Os schemas
ficam duplicados em cada serviço apenas para permitir que cada Prisma Client
saiba quais tabelas pode acessar.

Tabelas principais:

| Tabela           | Descrição                                                            |
| ---------------- | -------------------------------------------------------------------- |
| `usuarios`       | Alunos                                                               |
| `universidades`  | Instituições                                                         |
| `categorias`     | Categorias de reclamação (Infraestrutura, Ensino, ...)               |
| `reclamacoes`    | Reclamações dos alunos                                               |
| `comentarios`    | Comentários (de alunos OU resposta oficial de universidades)         |
| `likes`          | Likes em reclamações e em comentários                                |
| `avaliacoes`     | Nota (0-5) de aluno para universidade                                |
| `notificacoes`   | **TB2** — notificações para alunos ou universidades                  |

A tabela `notificacoes` tem `usuarioId` **OU** `universidadeId` preenchido
(nunca os dois) e referencia opcionalmente a `reclamacaoId` que originou a
notificação. Os tipos atuais são:

- `nova_reclamacao` — disparada para a universidade quando um aluno
  registra uma nova reclamação contra ela.
- `novo_comentario` — disparada para o dono da reclamação e/ou para a
  universidade quando alguém comenta.
- `resposta_universidade` — disparada para o aluno quando a universidade
  responde oficialmente à reclamação dele.

---

## 5. API Pública (via Gateway)

Todas as rotas listadas abaixo são acessadas via `http://localhost:3000`.
Rotas marcadas com 🔒 exigem cookie HttpOnly válido (`token`).

### 5.1 Autenticação de Alunos

| Método | Rota                  | Descrição                                       |
| ------ | --------------------- | ----------------------------------------------- |
| POST   | `/auth/cadastro`      | Cadastro de aluno                               |
| POST   | `/auth/login`         | Login (seta cookie HttpOnly)                    |
| POST   | `/auth/logout` 🔒     | Limpa o cookie                                  |
| GET    | `/auth/me` 🔒         | Retorna o usuário do cookie atual               |
| GET    | `/auth/:id` 🔒        | Detalhe de um usuário                           |
| PUT    | `/auth/:id` 🔒        | Atualiza nome/e-mail                            |
| PUT    | `/auth/:id/senha` 🔒  | **TA4** — troca de senha com validação da atual |
| DELETE | `/auth/:id` 🔒        | Remove usuário                                  |

### 5.2 Autenticação de Universidades

| Método | Rota                          | Descrição                                |
| ------ | ----------------------------- | ---------------------------------------- |
| POST   | `/universidades/cadastro`     | Cadastro de universidade                 |
| POST   | `/universidades/login`        | Login (seta cookie HttpOnly, tipo `universidade`) |
| POST   | `/universidades/logout` 🔒    | Limpa o cookie                           |
| GET    | `/universidades`              | Lista pública (busca via `?search=`)     |
| GET    | `/universidades/:id`          | Detalhe                                  |
| PUT    | `/universidades/:id` 🔒       | Atualização                              |
| DELETE | `/universidades/:id` 🔒       | Remoção                                  |

### 5.3 Reclamações

| Método | Rota                  | Descrição                                                  |
| ------ | --------------------- | ---------------------------------------------------------- |
| GET    | `/complaints/feed`    | Feed paginado com filtros (`category`, `universityId`, `campus`, `page`, `limit`). Auth **opcional**: se houver, `user_liked` é por usuário |
| GET    | `/complaints/:id`     | Detalhe (auth opcional, mesma lógica)                      |
| POST   | `/complaints` 🔒      | Criar reclamação — **emite notificação para a universidade** |
| PUT    | `/complaints/:id` 🔒  | Atualizar (somente o dono — RNF1.3)                        |
| DELETE | `/complaints/:id` 🔒  | Remover (somente o dono — RNF1.3)                          |

> O middleware `optionalAuthMiddleware` decodifica o JWT se houver, mas
> não bloqueia visitantes anônimos. Importante: o `complaintController.list`
> **só popula `query.userId`** se o usuário logado for aluno
> (`req.user.type !== "universidade"`). Caso contrário, o feed acabaria
> filtrando reclamações pelo ID da universidade tratando-o como `alunoId`.

### 5.4 Interações

| Método | Rota                                                  | Descrição                                                 |
| ------ | ----------------------------------------------------- | --------------------------------------------------------- |
| GET    | `/interactions/comentarios/reclamacao/:id`            | Lista comentários (aceita auth opcional para `userLiked`) |
| POST   | `/interactions/comentarios` 🔒                        | Criar comentário — **emite notificações** (TB2)           |
| PUT    | `/interactions/comentarios/:id` 🔒                    | Editar (somente o autor)                                  |
| DELETE | `/interactions/comentarios/:id` 🔒                    | Excluir (somente o autor)                                 |
| POST   | `/interactions/likes/reclamacao` 🔒                   | Toggle like em reclamação                                 |
| POST   | `/interactions/likes/comentario` 🔒                   | Toggle like em comentário                                 |

### 5.5 Notificações (TB2 + TB3)

| Método | Rota                                                  | Descrição                                                  |
| ------ | ----------------------------------------------------- | ---------------------------------------------------------- |
| GET    | `/interactions/notificacoes` 🔒                       | Lista paginada (`?limit=`, `?offset=`, `?lida=true|false`) |
| GET    | `/interactions/notificacoes/unread-count` 🔒          | Contagem de não lidas (para o badge)                       |
| PUT    | `/interactions/notificacoes/:id/read` 🔒              | Marca uma como lida (só o dono — RNF1.3)                   |
| PUT    | `/interactions/notificacoes/read-all` 🔒              | Marca todas como lidas                                     |
| POST   | `/interactions/internal/notificacoes/nova-reclamacao` | **Interno** (usa header `x-internal-key`)                  |

A resposta de listagem inclui `meta.unreadCount`.

---

## 6. Fluxos Principais

### 6.1 Cadastro e Login

1. Frontend envia `POST /auth/cadastro` → senha é hasheada com bcrypt no
   `users-service`.
2. Login retorna **somente** `{ user }` no body; o token JWT vai num
   **Cookie HttpOnly** com `SameSite=lax` e `maxAge=1d` (TA1).
3. Frontend salva apenas dados não sensíveis em `sessionStorage`.
4. Logout chama `POST /auth/logout` que limpa o cookie via `res.clearCookie`.

### 6.2 Postagem de uma reclamação

1. `reclamacao.js` valida o formulário via `FormValidator` (TB4).
2. `POST /complaints` é proxied para `complaints-service` com o JWT
   convertido pelo gateway em `Authorization: Bearer`.
3. Após salvar, `complaintService.create` chama
   `complaintNotifications.onNovaReclamacao` que grava direto na tabela
   `notificacoes` (banco compartilhado) — TB2.
4. A universidade alvo passa a ver a notificação na tela.

### 6.3 Comentário e resposta

1. `POST /interactions/comentarios` cria o registro.
2. `interactionService.createComentario` dispara o helper:
   - Autor é aluno → notifica o dono da reclamação **e** a universidade.
   - Autor é universidade → notifica o dono da reclamação como
     `resposta_universidade`.

### 6.4 Visualização de notificações (TB3)

1. `notificacoes.html` chama `GET /interactions/notificacoes?limit=50`.
2. Cada card mostra tipo, mensagem, "há quanto tempo" e estado (lida/não lida).
3. Clique em um card marca como lido (`PUT /...:id/read`) e leva para a
   reclamação relacionada.
4. `api-config.js` expõe `refreshNotificationBadge()` que é chamado em
   `telaprincipal.html` e `telafeed.html` para atualizar o `🔔` no header.

---

## 7. Segurança

| Mecanismo                       | Onde                                       | Tarefa |
| ------------------------------- | ------------------------------------------ | ------ |
| JWT em **Cookie HttpOnly**      | `users-service` + gateway + frontend       | TA1    |
| `Helmet` com CSP customizada    | `gateway/src/app.js`                       | TA2    |
| `express-rate-limit` (global)   | `gateway/src/app.js` (600req/15min, com `skip` para `/auth/me` e `/interactions/notificacoes/unread-count`) | TA2 |
| Rate limit em login/cadastro    | `gateway/src/app.js` (20req/15min)         | TA2    |
| Autorização "dono do recurso"   | `complaints-service`, `interactions-service` | TA3 / TB2  |
| Senha atual obrigatória         | `PUT /auth/:id/senha`                      | TA4    |
| Bcrypt para hashing             | `userService`                              | (Base) |
| Validação visual de formulário  | `FormValidator` (frontend)                 | TB4    |
| Validação de payload no backend | `validators/userValidator.js` (Joi/Zod)    | (Base) |

O **gateway** converte o cookie `token` em `Authorization: Bearer <token>`
antes de fazer proxy para os microsserviços (TA1), eliminando a necessidade
de expor o JWT ao JavaScript no navegador. Também repassa fielmente
`Set-Cookie` recebido do microsserviço para o cliente via `res.append`
(preserva múltiplos cookies caso existam).

A **CSP** explicitada em `app.js` libera `'unsafe-inline'` em
`scriptSrcAttr` (necessário para os `onclick="..."` usados na navegação
das telas) e libera `https://cdn.jsdelivr.net` em `scriptSrc`/`styleSrc`
para o Bootstrap servido por CDN. Sem essas duas concessões, os botões
de navegação e a estilização Bootstrap deixavam de funcionar.

---

## 8. O que cada pessoa implementou

### 8.1 Pessoa A — Segurança e Infraestrutura

#### TA1 — JWT em Cookies HttpOnly (RNF1.1)

Migrado do `localStorage` para Cookies HttpOnly.

- `users-service/src/controllers/userController.js` e
  `universidadeController.js` agora chamam
  `res.cookie("token", token, { httpOnly: true, sameSite: "lax", maxAge: 1d })`
  no login e `res.clearCookie("token")` no logout.
- `users-service/src/middlewares/auth.js` aceita o token tanto pelo cookie
  quanto pelo header `Authorization`.
- `gateway/src/app.js` adicionou `cookie-parser`.
- `gateway/src/services/proxyService.js` **lê o cookie do cliente e injeta**
  `Authorization: Bearer <token>` antes de despachar para o microsserviço
  interno (comunicação server-to-server). Isso permite que
  `complaints-service` e `interactions-service` continuem validando por
  header sem precisar conhecer cookies. O proxy também:
  - remove headers tóxicos (`host`, `content-length`, `accept-encoding`,
    `connection`, `transfer-encoding`) antes de encaminhar;
  - força `accept-encoding: identity` para evitar respostas gzipped que
    quebravam o forward de `Set-Cookie` e JSON;
  - repassa `Set-Cookie` da resposta usando `res.append` (que preserva
    múltiplos cookies, ao contrário de `res.setHeader`).
- Todos os scripts do frontend (`api-config.js`, `login.js`, `feed.js`, …)
  usam `credentials: "include"`. Não há mais `localStorage.getItem('token')`
  em lugar nenhum.

#### TA2 — Helmet.js e Rate Limiting (RNF1.2)

Implementado em `gateway/src/app.js`:

- `helmet({ contentSecurityPolicy: { directives: ... } })` aplica todos os
  cabeçalhos de segurança padrão (`X-Content-Type-Options`,
  `X-Frame-Options`, etc.) com CSP customizada que libera:
  - `scriptSrc`: `'self' 'unsafe-inline' https://cdn.jsdelivr.net`
  - `scriptSrcAttr`: `'unsafe-inline'` (necessário para `onclick="..."`)
  - `styleSrc`: `'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com`
  - `fontSrc`: `'self' https://fonts.gstatic.com data:`
  - `imgSrc`: `'self' data:`
- `crossOriginResourcePolicy: { policy: "cross-origin" }` para permitir
  o uso de assets de CDN sem bloqueio CORP.
- `globalLimiter`: **600 req / 15 min** por IP em todas as rotas, com
  `skip` para `/auth/me` e
  `/interactions/notificacoes/unread-count` (chamadas frequentes do
  badge de notificações e do polling de sessão).
- `authLimiter`: **20 req / 15 min** por IP em `/auth/login`,
  `/universidades/login` e `/auth/cadastro`.

#### TA3 — Autorização "Dono do Recurso" (RNF1.3)

- `complaints-service/src/controllers/complaintController.js` busca
  `reclamacao.alunoId` e retorna **403** se diferente de `req.user.id` em
  `PUT` e `DELETE`.
- `interactions-service` já fazia essa validação em `updateComentario` e
  `deleteComentario` (em `interactionService.js`).
- A pessoa B estendeu esse padrão para a tabela `notificacoes`
  (`markNotificacaoAsRead` checa `usuarioId` ou `universidadeId`).

#### TA4 — Confirmação de Senha Atual (RNF1.4)

- Novo método `userService.changePassword(userId, senhaAtual, novaSenha)`
  que valida a senha atual com `bcrypt.compare` antes de gravar.
- Rota dedicada: `PUT /auth/:id/senha`.
- `frontend/scripts/config.js` chama esse endpoint separado quando o usuário
  preenche os campos de troca de senha — agora também integrado com a
  validação visual de TB4.

#### TA5 — Testes (RNF1.6)

Todos os microsserviços possuem testes de integração HTTP (Jest +
Supertest) com mocks — sem dependência de banco real.

| Serviço | Arquivo(s) de teste | Cobertura principal |
|---------|---------------------|---------------------|
| **gateway** | `tests/gateway.test.js` | Headers Helmet, rate limiting (429), health check |
| **users-service** | `tests/auth.test.js` | Cadastro, login, logout, troca de senha, `/auth/me` |
| **users-service** | `tests/universidade.test.js` | Cadastro/login de universidade, listagem |
| **users-service** | `tests/avaliacao.test.js` | Criar/atualizar avaliação, média, avaliação do usuário |
| **complaints-service** | `tests/complaints.test.js` | Feed, CRUD, autenticação, autorização (dono do recurso) |
| **interactions-service** | `tests/interactions.test.js` | Comentários, notificações, likes, endpoint interno |

**CI/CD:** workflow `.github/workflows/ci.yml` executa todos os testes no
GitHub Actions a cada push/PR.

---

### 8.2 Pessoa B — Funcionalidades e Usabilidade

#### TB2 — Tabela de notificações + geração automática (RF1.2)

**Modelagem Prisma (`interactions-service/prisma/schema.prisma` e
`complaints-service/prisma/schema.prisma`):**

```prisma
model Notificacao {
  id                Int           @id @default(autoincrement())
  mensagem          String
  tipo              String        // novo_comentario | resposta_universidade | nova_reclamacao
  lida              Boolean       @default(false)
  reclamacaoId      Int?
  usuarioId         Int?          // destinatário aluno
  universidadeId    Int?          // destinatário universidade
  createdAt         DateTime      @default(now())

  reclamacao        Reclamacao?   @relation(fields: [reclamacaoId], references: [id], onDelete: Cascade)
  usuario           Usuario?      @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  universidade      Universidade? @relation(fields: [universidadeId], references: [id], onDelete: Cascade)

  @@index([usuarioId, lida])
  @@index([universidadeId, lida])
  @@map("notificacoes")
}
```

Os relacionamentos inversos (`Usuario.notificacoes`,
`Universidade.notificacoes`, `Reclamacao.notificacoes`) também foram
adicionados.

**Migration:**
`interactions-service/prisma/migrations/20260524000000_add_notificacoes/migration.sql`
cria a tabela, dois índices compostos para acelerar a contagem de
"não lidas" e três foreign keys com `ON DELETE CASCADE`. O
`docker-entrypoint.sh` aplica essa migration automaticamente ao subir o
container.

**Disparo de notificações:**

- `interactions-service/src/services/notificationHelper.js` centraliza a
  criação em três funções (`onNovoComentarioDeAluno`,
  `onRespostaDeUniversidade`, `onNovaReclamacao`). Toda chamada é
  "fire-and-forget" e tem `try/catch` interno — uma falha em notificação
  **nunca** derruba a operação principal.
- `interactionService.createComentario` chama o helper apropriado conforme
  o autor (aluno ou universidade).
- `complaints-service/src/services/notificationHelper.js` espelha a função
  `onNovaReclamacao` usando o Prisma Client local (mesmo banco
  compartilhado) e é chamado por `complaintService.create`.

#### TB3 — Visualização de notificações (RF1.3)

**Backend** (`interactions-service`):

- `GET /interactions/notificacoes` — listagem paginada, com filtro `?lida=`
  e `meta.unreadCount` na resposta. Decide entre aluno e universidade pelo
  campo `req.user.type`.
- `GET /interactions/notificacoes/unread-count` — usado para o badge
  global.
- `PUT /interactions/notificacoes/:id/read` — marca uma como lida,
  verificando o dono (`usuarioId` ou `universidadeId`).
- `PUT /interactions/notificacoes/read-all` — marca todas em lote.

**Frontend:**

- `frontend/pages/notificacoes.html` foi reescrita: dark mode consistente
  com o resto do app, contagem de não lidas, filtros
  *Todas / Não lidas / Lidas*, "marcar todas como lidas" e cards clicáveis
  que abrem a reclamação relacionada e marcam como lidas.
- `frontend/scripts/notificacoes.js` implementa toda essa lógica usando
  `fetchWithAuth` (cookie HttpOnly).
- `frontend/scripts/api-config.js` ganhou `getUnreadNotificationsCount()` e
  `refreshNotificationBadge()` para manter o `🔔` no header das telas
  principais sincronizado (refresh a cada 60s na `telaprincipal.html` e a
  cada navegação na `telafeed.html`).

#### TB4 — Validação visual de formulários (RNF1.5)

Foi criada uma biblioteca de validação reutilizável compartilhada por
**todos** os formulários do sistema:

- **`frontend/scripts/form-validation.js`** — expõe `window.FormValidator`
  com a API:

  ```js
  FormValidator.attach('#meu-form', {
    fields: {
      email: { required: true, email: true, label: 'E-mail' },
      senha: { required: true, strongPassword: true, label: 'Senha' }
    },
    onSubmit: async (values) => { /* só roda se tudo válido */ }
  });
  ```

  Regras suportadas: `required`, `email`, `minLength`, `maxLength`,
  `pattern` (+ `patternMessage`), `match` (+ `matchMessage`),
  `strongPassword`, `custom(value, allValues)`.

  Recursos:

  - Mensagem de erro abaixo do campo em vermelho (em tempo real, com
    `blur` / `input` / `change`).
  - Marcação visual `is-invalid` / `is-valid` (borda vermelha/verde).
  - Resumo de erros no topo do formulário quando `submit` é bloqueado.
  - "Hint" interativo para senhas fortes (lista de regras + barra de força
    com 5 níveis).
  - `setServerError(field, message)` para exibir erros do backend abaixo
    do campo certo (usado em `config.js` para "Senha atual incorreta").

  > **Decisão importante**: a mensagem de erro é inserida como **irmão
  > direto** do campo via `insertAdjacentElement("afterend", err)`, **sem
  > envolver o campo num wrapper**. Isso evita um bug do Firefox (e de
  > alguns Chrome no Linux) em que mover um `<select>` já renderizado
  > para outro nó pai trava o popup nativo do dropdown — o campo
  > continua focável mas o menu suspenso não abre mais. Pelo mesmo
  > motivo, todo código que repopula `<select>` em runtime
  > (`feed.js`, `reclamacao.js`) usa `select.remove(0)` + `appendChild`
  > em vez de `select.innerHTML = "..."`.

- **`frontend/styles/form-validation.css`** — todos os estilos
  (cores adaptadas ao dark mode do app, transições suaves). Visibilidade
  da mensagem de erro é controlada por `.fv-error-message.visible` (sem
  depender de um wrapper).

- **Formulários adaptados:**
  - `cadastro.html` / `cadastro.js` — nome (condicional), e-mail forte,
    senha forte com hint.
  - `login.html` / `login.js`
  - `cadastro-universidade.html` / `cadastro-universidade.js`
  - `login-universidade.html` / `login-universidade.js`
  - `reclamacao.html` / `reclamacao.js` — título, categoria, instituição,
    campus e descrição (com `minLength: 20`).
  - `config.html` / `config.js` — perfil + troca de senha com regras
    cruzadas (se preencher qualquer campo de senha, todos viram
    obrigatórios e a confirmação é checada).
  - `telacomentarios.html` / `comentarios.js`.

---

## 9. Como isso atende aos requisitos do trabalho

### 9.1 Fase 1 — Interface gráfica

Frontend completo em HTML5 + Bootstrap 5 + CSS3, com tema escuro
consistente, layout responsivo e fluxo navegacional cobrindo: login/
cadastro (aluno e universidade), feed, detalhe de reclamação,
comentários, perfil, configurações, notificações e busca de universidade.

### 9.2 Fase 2 — Implementação de conceitos

| Conceito                                  | Onde é demonstrado                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| Comunicação síncrona/assíncrona (Fetch)   | Todos os scripts do `frontend/scripts/` — todas as chamadas são `async/await fetch(...)` |
| **Web Storage API**                       | `sessionStorage` em `login.js`, `login-universidade.js`, `config.js`        |
| **HTTP Cookies**                          | Cookie HttpOnly do JWT (TA1) + `cookie-parser` no gateway e no users-service |
| HTTP Authentication                       | JWT (Bearer / cookie) com middlewares `auth.js` e `authMiddleware.js`        |
| Mecanismo extra de segurança              | **Helmet** (cabeçalhos) + **Rate Limiting** (anti-bruteforce) + **autorização por dono do recurso** + **bcrypt** para senhas |
| **Validação de formulários**              | TB4 — biblioteca `FormValidator` aplicada a 7 formulários                   |

### 9.3 Fase 3 — Integração com banco e finalização

- **Frameworks server-side**: Express + Prisma em todos os serviços; Joi/
  Zod (validators) no users-service.
- **Modelagem e banco**: PostgreSQL via Prisma com 8 tabelas (incluindo a
  nova `notificacoes` de TB2). Schema em `*/prisma/schema.prisma`.
- **Banco no Docker**: `postgres:15` declarado em `docker-compose.yml` com
  `healthcheck` e volume `postgres-data`. Migrations aplicadas
  automaticamente no boot do `interactions-service`.
- **Testes**: cobertura em todos os microsserviços (gateway, users-service,
  complaints-service, interactions-service) com Jest + Supertest.
- **CI/CD**: pipeline GitHub Actions (`.github/workflows/ci.yml`) roda os
  testes automaticamente em push e pull request.

---

## 10. Decisões técnicas e correções importantes

Alguns bugs sutis foram corrigidos no caminho e merecem registro para
quem for manter o código:

### 10.1 `user_liked` por usuário no feed
A rota `GET /complaints/feed` originalmente não tinha auth — o frontend
recebia sempre `user_liked: false` e o "primeiro clique" de quem já tinha
curtido em outra sessão acabava **descurtindo**. Solução: adicionar
`optionalAuthMiddleware` na rota e calcular `user_liked` per-user. **Mas
`query.userId` é usado SÓ no cálculo de likes** — em `complaintService.list`
ele NÃO entra em `Complaint.findAll`, senão o feed começa a mostrar
apenas as reclamações do usuário logado.

### 10.2 Botão "Adicionar Reclamação" aparecendo para universidade
O `userType` é guardado em `sessionStorage` (escrito por
`login.js`/`login-universidade.js`), mas `feed.js` lia de `localStorage`.
Resultado: sempre `null` e o botão nunca era escondido. Fix em
`frontend/scripts/feed.js`.

### 10.3 Botões `onclick="..."` deixando de funcionar
O Helmet aplica `script-src-attr 'none'` por padrão, o que bloqueia todos
os handlers inline. Os botões "Voltar" do feed e os cards de navegação
da `telaprincipal.html` paravam de funcionar silenciosamente. Fix:
explicitar `scriptSrcAttr: ["'unsafe-inline'"]` na CSP.

### 10.4 Dropdowns nativos do `<select>` não abrindo
Dois sintomas distintos com mesma raiz no Firefox/alguns Chrome Linux:

1. **Validação visual quebrando o popup** — o `FormValidator` envolvia o
   `<select>` num wrapper `.fv-field`. Mover um `<select>` já renderizado
   para outro nó pai trava o popup nativo do dropdown. Fix: a mensagem
   de erro é inserida como irmão direto via `insertAdjacentElement`.
2. **`select.innerHTML = "..."` quebrando o popup** — repopular os
   filhos de um `<select>` via `innerHTML` causa o mesmo travamento. Fix:
   usar `select.remove(0)` em loop + `appendChild` para cada nova
   `<option>`. Aplicado em `feed.js` (filtros) e `reclamacao.js`
   (instituição/campus).

### 10.5 Migration do Prisma ficando "stuck"
O Prisma marca migrations como "failed" no banco e bloqueia
`prisma migrate deploy` futuras (erro `P3009`). O
`interactions-service/docker-entrypoint.sh` foi reforçado para detectar
falhas e tentar `prisma migrate resolve --rolled-back` antes de
re-aplicar — e, como último recurso, marcar como `--applied`. A migration
de `notificacoes` também foi tornada idempotente usando
`CREATE TABLE IF NOT EXISTS` + blocos `DO $$ ... EXCEPTION WHEN
duplicate_object THEN NULL; END $$` para as FKs.

---

## 11. Próximos Passos

- Adicionar paginação visual na `notificacoes.html`.
- Avaliar relatório de cobertura de código (coverage) no CI.
- Avaliar testes E2E com Docker Compose + Playwright.
- Avaliar mover as notificações em tempo real para WebSockets
  (`socket.io`) — a tabela e os endpoints já suportariam essa evolução.
- Avaliar substituir os `<select>` nativos por componentes custom
  (ex.: Choices.js) caso queiramos integrar o popup ao dark theme; hoje
  os `<option>` saem com fundo branco/preto por compatibilidade.
