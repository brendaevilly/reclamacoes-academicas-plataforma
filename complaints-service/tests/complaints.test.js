import request from "supertest";
import jwt from "jsonwebtoken";
import { jest, describe, it, expect, beforeEach, beforeAll } from "@jest/globals";

const mockCreate = jest.fn();
const mockFindAll = jest.fn();
const mockCountAll = jest.fn();
const mockFindById = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockUsuarioFindUnique = jest.fn();
const mockReclamacaoFindUnique = jest.fn();
const mockLikeCount = jest.fn();
const mockLikeFindFirst = jest.fn();
const mockOnNovaReclamacao = jest.fn().mockResolvedValue(undefined);

jest.unstable_mockModule("../src/models/Complaint.js", () => ({
    default: {
        create: (...args) => mockCreate(...args),
        findAll: (...args) => mockFindAll(...args),
        countAll: (...args) => mockCountAll(...args),
        findById: (...args) => mockFindById(...args),
        update: (...args) => mockUpdate(...args),
        delete: (...args) => mockDelete(...args),
    }
}));

jest.unstable_mockModule("../src/database/connection.js", () => ({
    default: {
        usuario: { findUnique: (...args) => mockUsuarioFindUnique(...args) },
        reclamacao: { findUnique: (...args) => mockReclamacaoFindUnique(...args) },
        like: {
            count: (...args) => mockLikeCount(...args),
            findFirst: (...args) => mockLikeFindFirst(...args),
        }
    }
}));

jest.unstable_mockModule("../src/services/notificationHelper.js", () => ({
    complaintNotifications: {
        onNovaReclamacao: (...args) => mockOnNovaReclamacao(...args),
    }
}));

const JWT_SECRET = "test-secret-key";

function authHeader(userId = 1) {
    const token = jwt.sign({ id: userId, type: "aluno" }, JWT_SECRET, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}` };
}

const sampleComplaint = {
    id: 1,
    titulo: "Problema no refeitório",
    descricao: "Comida fria",
    categoria: { nome: "Alimentação" },
    universidade: { id: 1, nome: "UFX", sigla: "UFX", campus: "Campus Central" },
    universidadeId: 1,
    aluno: { id: 1, nome: "João", email: "joao@test.com" },
    alunoId: 1,
    createdAt: new Date(),
    _count: { comentarios: 0 }
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
    mockLikeCount.mockResolvedValue(0);
    mockLikeFindFirst.mockResolvedValue(null);
});

describe("GET /complaints/feed", () => {
    it("deve retornar o feed para visitantes anônimos", async () => {
        mockFindAll.mockResolvedValue([sampleComplaint]);
        mockCountAll.mockResolvedValue(1);

        const res = await request(app).get("/complaints/feed");

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("data");
        expect(res.body.data).toHaveLength(1);
    });

    it("deve retornar o feed para usuário autenticado", async () => {
        mockFindAll.mockResolvedValue([sampleComplaint]);
        mockCountAll.mockResolvedValue(1);
        mockLikeFindFirst.mockResolvedValue({ id: 1 });

        const res = await request(app)
            .get("/complaints/feed")
            .set(authHeader(1));

        expect(res.status).toBe(200);
        expect(res.body.data[0]).toHaveProperty("user_liked", true);
    });
});

describe("POST /complaints", () => {
    it("deve retornar 401 sem token", async () => {
        const res = await request(app)
            .post("/complaints")
            .send({ titulo: "Teste", descricao: "Desc", universidadeId: 1 });

        expect(res.status).toBe(401);
    });

    it("deve retornar 400 se campos obrigatórios faltarem", async () => {
        mockUsuarioFindUnique.mockResolvedValue({ id: 1 });

        const res = await request(app)
            .post("/complaints")
            .set(authHeader(1))
            .send({ titulo: "Só título" });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("message");
    });

    it("deve retornar 404 se o usuário não existir", async () => {
        mockUsuarioFindUnique.mockResolvedValue(null);

        const res = await request(app)
            .post("/complaints")
            .set(authHeader(99))
            .send({
                titulo: "Problema",
                descricao: "Descrição",
                universidadeId: 1
            });

        expect(res.status).toBe(404);
    });

    it("deve criar reclamação com sucesso", async () => {
        mockUsuarioFindUnique.mockResolvedValue({ id: 1 });
        mockCreate.mockResolvedValue(sampleComplaint);

        const res = await request(app)
            .post("/complaints")
            .set(authHeader(1))
            .send({
                titulo: "Problema no refeitório",
                descricao: "Comida fria",
                universidadeId: 1,
                categoriaId: "alimentacao"
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("message");
        expect(res.body).toHaveProperty("data");
    });
});

describe("GET /complaints/:id", () => {
    it("deve retornar 404 se não encontrada", async () => {
        mockFindById.mockResolvedValue(null);

        const res = await request(app).get("/complaints/999");

        expect(res.status).toBe(404);
    });

    it("deve retornar reclamação encontrada", async () => {
        mockFindById.mockResolvedValue(sampleComplaint);

        const res = await request(app).get("/complaints/1");

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("data");
    });
});

describe("PUT /complaints/:id", () => {
    it("deve retornar 401 sem autenticação", async () => {
        const res = await request(app)
            .put("/complaints/1")
            .send({ titulo: "Novo título" });

        expect(res.status).toBe(401);
    });

    it("deve retornar 403 se não for o dono", async () => {
        mockReclamacaoFindUnique.mockResolvedValue({ alunoId: 2 });

        const res = await request(app)
            .put("/complaints/1")
            .set(authHeader(1))
            .send({ titulo: "Novo título" });

        expect(res.status).toBe(403);
    });

    it("deve retornar 404 se reclamação não existir", async () => {
        mockReclamacaoFindUnique.mockResolvedValue(null);

        const res = await request(app)
            .put("/complaints/999")
            .set(authHeader(1))
            .send({ titulo: "Novo título" });

        expect(res.status).toBe(404);
    });

    it("deve atualizar com sucesso", async () => {
        mockReclamacaoFindUnique.mockResolvedValue({ alunoId: 1 });
        mockUpdate.mockResolvedValue({ ...sampleComplaint, titulo: "Atualizado" });

        const res = await request(app)
            .put("/complaints/1")
            .set(authHeader(1))
            .send({ titulo: "Atualizado" });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("data");
    });
});

describe("DELETE /complaints/:id", () => {
    it("deve retornar 401 sem autenticação", async () => {
        const res = await request(app).delete("/complaints/1");

        expect(res.status).toBe(401);
    });

    it("deve retornar 403 se não for o dono", async () => {
        mockReclamacaoFindUnique.mockResolvedValue({ alunoId: 2 });

        const res = await request(app)
            .delete("/complaints/1")
            .set(authHeader(1));

        expect(res.status).toBe(403);
    });

    it("deve excluir com sucesso", async () => {
        mockReclamacaoFindUnique.mockResolvedValue({ alunoId: 1 });
        mockDelete.mockResolvedValue(sampleComplaint);

        const res = await request(app)
            .delete("/complaints/1")
            .set(authHeader(1));

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("message");
    });
});
