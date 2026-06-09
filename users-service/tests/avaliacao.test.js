import request from "supertest";
import jwt from "jsonwebtoken";
import { jest, describe, it, expect, beforeEach, beforeAll } from "@jest/globals";

const mockCreateOrUpdate = jest.fn();
const mockGetAverageRating = jest.fn();
const mockFindByUsuarioAndUniversidade = jest.fn();

jest.unstable_mockModule("../src/models/User.js", () => ({
    User: {
        findByEmail: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        findAll: jest.fn().mockResolvedValue([]),
        delete: jest.fn(),
    }
}));

jest.unstable_mockModule("../src/models/Universidade.js", () => ({
    Universidade: {
        findByEmail: jest.fn().mockResolvedValue(null),
        findByCampus: jest.fn().mockResolvedValue(null),
        findAll: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    }
}));

jest.unstable_mockModule("../src/models/Avaliacao.js", () => ({
    Avaliacao: {
        createOrUpdate: (...args) => mockCreateOrUpdate(...args),
        getAverageRating: (...args) => mockGetAverageRating(...args),
        findByUsuarioAndUniversidade: (...args) => mockFindByUsuarioAndUniversidade(...args),
    }
}));

jest.unstable_mockModule("../src/database/connection.js", () => ({
    prisma: {
        universidade: { findMany: jest.fn().mockResolvedValue([]) }
    }
}));

const JWT_SECRET = "test-secret-key-for-jest";

function authHeader(userId = 1) {
    const token = jwt.sign({ id: userId, type: "aluno" }, JWT_SECRET, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}` };
}

let app;

beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.NODE_ENV = "test";

    const appModule = await import("../src/app.js");
    app = appModule.default;
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe("POST /avaliacoes", () => {
    it("deve retornar 401 sem autenticação", async () => {
        const res = await request(app)
            .post("/avaliacoes")
            .send({ universidadeId: 1, nota: 4 });

        expect(res.status).toBe(401);
    });

    it("deve retornar 400 se campos obrigatórios faltarem", async () => {
        const res = await request(app)
            .post("/avaliacoes")
            .set(authHeader())
            .send({ universidadeId: 1 });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
    });

    it("deve retornar 400 se nota estiver fora do intervalo", async () => {
        const res = await request(app)
            .post("/avaliacoes")
            .set(authHeader())
            .send({ universidadeId: 1, nota: 6 });

        expect(res.status).toBe(400);
    });

    it("deve criar ou atualizar avaliação com sucesso", async () => {
        mockCreateOrUpdate.mockResolvedValue({
            id: 1,
            universidadeId: 1,
            usuarioId: 1,
            nota: 4
        });

        const res = await request(app)
            .post("/avaliacoes")
            .set(authHeader())
            .send({ universidadeId: 1, nota: 4 });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("nota", 4);
    });
});

describe("GET /avaliacoes/universidade/:id/media", () => {
    it("deve retornar média de avaliações", async () => {
        mockGetAverageRating.mockResolvedValue({ media: 4.2, total: 10 });

        const res = await request(app).get("/avaliacoes/universidade/1/media");

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("media", 4.2);
    });
});

describe("GET /avaliacoes/universidade/:id/usuario", () => {
    it("deve retornar 401 sem autenticação", async () => {
        const res = await request(app).get("/avaliacoes/universidade/1/usuario");

        expect(res.status).toBe(401);
    });

    it("deve retornar avaliação do usuário logado", async () => {
        mockFindByUsuarioAndUniversidade.mockResolvedValue({ nota: 5 });

        const res = await request(app)
            .get("/avaliacoes/universidade/1/usuario")
            .set(authHeader());

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("nota", 5);
    });

    it("deve retornar nota null se usuário não avaliou", async () => {
        mockFindByUsuarioAndUniversidade.mockResolvedValue(null);

        const res = await request(app)
            .get("/avaliacoes/universidade/1/usuario")
            .set(authHeader());

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("nota", null);
    });
});
