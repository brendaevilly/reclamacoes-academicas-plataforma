import request from "supertest";
import jwt from "jsonwebtoken";
import { jest, describe, it, expect, beforeEach, beforeAll } from "@jest/globals";

const mockComentarioCreate = jest.fn();
const mockComentarioFindByReclamacao = jest.fn();
const mockComentarioFindById = jest.fn();
const mockComentarioUpdate = jest.fn();
const mockComentarioDelete = jest.fn();

const mockLikeToggle = jest.fn();
const mockLikeCountByReclamacao = jest.fn();
const mockLikeCountByComentario = jest.fn();
const mockLikeUserLikedComentario = jest.fn();

const mockNotifFindByUsuario = jest.fn();
const mockNotifFindByUniversidade = jest.fn();
const mockNotifCountUnreadByUsuario = jest.fn();
const mockNotifCountUnreadByUniversidade = jest.fn();
const mockNotifFindById = jest.fn();
const mockNotifMarkAsRead = jest.fn();
const mockNotifMarkAllAsReadByUsuario = jest.fn();
const mockNotifMarkAllAsReadByUniversidade = jest.fn();

const mockOnNovaReclamacao = jest.fn().mockResolvedValue(undefined);
const mockOnNovoComentarioDeAluno = jest.fn().mockResolvedValue(undefined);
const mockOnRespostaDeUniversidade = jest.fn().mockResolvedValue(undefined);

jest.unstable_mockModule("../src/models/Comentario.js", () => ({
    default: {
        create: (...args) => mockComentarioCreate(...args),
        findByReclamacao: (...args) => mockComentarioFindByReclamacao(...args),
        findById: (...args) => mockComentarioFindById(...args),
        update: (...args) => mockComentarioUpdate(...args),
        delete: (...args) => mockComentarioDelete(...args),
    }
}));

jest.unstable_mockModule("../src/models/Like.js", () => ({
    default: {
        toggle: (...args) => mockLikeToggle(...args),
        countByReclamacao: (...args) => mockLikeCountByReclamacao(...args),
        countByComentario: (...args) => mockLikeCountByComentario(...args),
        userLikedComentario: (...args) => mockLikeUserLikedComentario(...args),
    }
}));

jest.unstable_mockModule("../src/models/Notificacao.js", () => ({
    default: {
        findByUsuario: (...args) => mockNotifFindByUsuario(...args),
        findByUniversidade: (...args) => mockNotifFindByUniversidade(...args),
        countUnreadByUsuario: (...args) => mockNotifCountUnreadByUsuario(...args),
        countUnreadByUniversidade: (...args) => mockNotifCountUnreadByUniversidade(...args),
        findById: (...args) => mockNotifFindById(...args),
        markAsRead: (...args) => mockNotifMarkAsRead(...args),
        markAllAsReadByUsuario: (...args) => mockNotifMarkAllAsReadByUsuario(...args),
        markAllAsReadByUniversidade: (...args) => mockNotifMarkAllAsReadByUniversidade(...args),
    }
}));

jest.unstable_mockModule("../src/services/notificationHelper.js", () => ({
    notificationHelper: {
        onNovaReclamacao: (...args) => mockOnNovaReclamacao(...args),
        onNovoComentarioDeAluno: (...args) => mockOnNovoComentarioDeAluno(...args),
        onRespostaDeUniversidade: (...args) => mockOnRespostaDeUniversidade(...args),
    }
}));

const JWT_SECRET = "test-secret-key";

function authHeader(userId = 1, type = "aluno") {
    const token = jwt.sign({ id: userId, type }, JWT_SECRET, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}` };
}

const sampleComentario = {
    id: 1,
    texto: "Comentário de teste",
    reclamacaoId: 1,
    autorId: 1,
    universidadeId: null,
    createdAt: new Date()
};

let app;

beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.NODE_ENV = "test";

    const appModule = await import("../src/app.js");
    app = appModule.default;
});

beforeEach(() => {
    jest.clearAllMocks();
    mockLikeCountByComentario.mockResolvedValue(0);
    mockLikeUserLikedComentario.mockResolvedValue(false);
    mockLikeCountByReclamacao.mockResolvedValue(0);
});

// ========== COMENTÁRIOS ==========

describe("POST /interactions/comentarios", () => {
    it("deve retornar 401 sem autenticação", async () => {
        const res = await request(app)
            .post("/interactions/comentarios")
            .send({ texto: "Oi", reclamacaoId: 1 });

        expect(res.status).toBe(401);
    });

    it("deve retornar 400 se campos obrigatórios faltarem", async () => {
        const res = await request(app)
            .post("/interactions/comentarios")
            .set(authHeader())
            .send({ texto: "Só texto" });

        expect(res.status).toBe(400);
    });

    it("deve criar comentário com sucesso", async () => {
        mockComentarioCreate.mockResolvedValue(sampleComentario);

        const res = await request(app)
            .post("/interactions/comentarios")
            .set(authHeader())
            .send({ texto: "Comentário de teste", reclamacaoId: 1 });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("data");
    });
});

describe("GET /interactions/comentarios/reclamacao/:id", () => {
    it("deve listar comentários sem autenticação", async () => {
        mockComentarioFindByReclamacao.mockResolvedValue([sampleComentario]);

        const res = await request(app).get("/interactions/comentarios/reclamacao/1");

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
    });

    it("deve incluir userLiked quando autenticado", async () => {
        mockComentarioFindByReclamacao.mockResolvedValue([sampleComentario]);
        mockLikeUserLikedComentario.mockResolvedValue(true);

        const res = await request(app)
            .get("/interactions/comentarios/reclamacao/1")
            .set(authHeader());

        expect(res.status).toBe(200);
        expect(res.body.data[0]).toHaveProperty("userLiked", true);
    });
});

describe("PUT /interactions/comentarios/:id", () => {
    it("deve retornar 401 sem autenticação", async () => {
        const res = await request(app)
            .put("/interactions/comentarios/1")
            .send({ texto: "Novo texto" });

        expect(res.status).toBe(401);
    });

    it("deve retornar 403 se não for o autor", async () => {
        mockComentarioFindById.mockResolvedValue({ ...sampleComentario, autorId: 2 });

        const res = await request(app)
            .put("/interactions/comentarios/1")
            .set(authHeader(1))
            .send({ texto: "Novo texto" });

        expect(res.status).toBe(403);
    });

    it("deve atualizar com sucesso", async () => {
        mockComentarioFindById.mockResolvedValue(sampleComentario);
        mockComentarioUpdate.mockResolvedValue({ ...sampleComentario, texto: "Atualizado" });

        const res = await request(app)
            .put("/interactions/comentarios/1")
            .set(authHeader())
            .send({ texto: "Atualizado" });

        expect(res.status).toBe(200);
    });
});

describe("DELETE /interactions/comentarios/:id", () => {
    it("deve retornar 404 se comentário não existir", async () => {
        mockComentarioFindById.mockResolvedValue(null);

        const res = await request(app)
            .delete("/interactions/comentarios/999")
            .set(authHeader());

        expect(res.status).toBe(404);
    });

    it("deve deletar com sucesso", async () => {
        mockComentarioFindById.mockResolvedValue(sampleComentario);
        mockComentarioDelete.mockResolvedValue(true);

        const res = await request(app)
            .delete("/interactions/comentarios/1")
            .set(authHeader());

        expect(res.status).toBe(200);
    });
});

// ========== NOTIFICAÇÕES ==========

describe("GET /interactions/notificacoes", () => {
    it("deve retornar 401 sem autenticação", async () => {
        const res = await request(app).get("/interactions/notificacoes");

        expect(res.status).toBe(401);
    });

    it("deve listar notificações do aluno", async () => {
        mockNotifFindByUsuario.mockResolvedValue([{ id: 1, mensagem: "Nova resposta" }]);
        mockNotifCountUnreadByUsuario.mockResolvedValue(1);

        const res = await request(app)
            .get("/interactions/notificacoes")
            .set(authHeader(1, "aluno"));

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("meta");
        expect(res.body.meta).toHaveProperty("unreadCount", 1);
    });

    it("deve listar notificações da universidade", async () => {
        mockNotifFindByUniversidade.mockResolvedValue([{ id: 1, mensagem: "Nova reclamação" }]);
        mockNotifCountUnreadByUniversidade.mockResolvedValue(2);

        const res = await request(app)
            .get("/interactions/notificacoes")
            .set(authHeader(1, "universidade"));

        expect(res.status).toBe(200);
        expect(res.body.meta).toHaveProperty("unreadCount", 2);
    });
});

describe("GET /interactions/notificacoes/unread-count", () => {
    it("deve retornar 401 sem autenticação", async () => {
        const res = await request(app).get("/interactions/notificacoes/unread-count");

        expect(res.status).toBe(401);
    });

    it("deve retornar contagem de não lidas", async () => {
        mockNotifCountUnreadByUsuario.mockResolvedValue(3);

        const res = await request(app)
            .get("/interactions/notificacoes/unread-count")
            .set(authHeader());

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty("unreadCount", 3);
    });
});

describe("PUT /interactions/notificacoes/:id/read", () => {
    it("deve retornar 401 sem autenticação", async () => {
        const res = await request(app).put("/interactions/notificacoes/1/read");

        expect(res.status).toBe(401);
    });

    it("deve marcar notificação como lida", async () => {
        mockNotifFindById.mockResolvedValue({ id: 1, usuarioId: 1, universidadeId: null });
        mockNotifMarkAsRead.mockResolvedValue({ id: 1, lida: true });

        const res = await request(app)
            .put("/interactions/notificacoes/1/read")
            .set(authHeader());

        expect(res.status).toBe(200);
    });
});

describe("PUT /interactions/notificacoes/read-all", () => {
    it("deve marcar todas como lidas", async () => {
        mockNotifMarkAllAsReadByUsuario.mockResolvedValue(5);

        const res = await request(app)
            .put("/interactions/notificacoes/read-all")
            .set(authHeader());

        expect(res.status).toBe(200);
    });
});

describe("POST /interactions/internal/notificacoes/nova-reclamacao", () => {
    it("deve retornar 401 com chave interna inválida", async () => {
        const res = await request(app)
            .post("/interactions/internal/notificacoes/nova-reclamacao")
            .send({ reclamacaoId: 1, universidadeId: 1 });

        expect(res.status).toBe(401);
    });

    it("deve criar notificação interna com chave válida", async () => {
        const res = await request(app)
            .post("/interactions/internal/notificacoes/nova-reclamacao")
            .set("x-internal-key", JWT_SECRET)
            .send({ reclamacaoId: 1, titulo: "Nova", universidadeId: 1 });

        expect(res.status).toBe(201);
    });
});

// ========== LIKES ==========

describe("POST /interactions/likes/reclamacao", () => {
    it("deve retornar 401 sem autenticação", async () => {
        const res = await request(app)
            .post("/interactions/likes/reclamacao")
            .send({ reclamacaoId: 1 });

        expect(res.status).toBe(401);
    });

    it("deve retornar 400 sem reclamacaoId", async () => {
        const res = await request(app)
            .post("/interactions/likes/reclamacao")
            .set(authHeader())
            .send({});

        expect(res.status).toBe(400);
    });

    it("deve alternar like com sucesso", async () => {
        mockLikeToggle.mockResolvedValue({ liked: true });
        mockLikeCountByReclamacao.mockResolvedValue(1);

        const res = await request(app)
            .post("/interactions/likes/reclamacao")
            .set(authHeader())
            .send({ reclamacaoId: 1 });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty("liked", true);
    });
});

describe("POST /interactions/likes/comentario", () => {
    it("deve retornar 400 sem comentarioId", async () => {
        const res = await request(app)
            .post("/interactions/likes/comentario")
            .set(authHeader())
            .send({});

        expect(res.status).toBe(400);
    });

    it("deve alternar like de comentário com sucesso", async () => {
        mockLikeToggle.mockResolvedValue({ liked: false });
        mockLikeCountByComentario.mockResolvedValue(0);

        const res = await request(app)
            .post("/interactions/likes/comentario")
            .set(authHeader())
            .send({ comentarioId: 1 });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty("liked", false);
    });
});
