import request from "supertest";
import bcrypt from "bcryptjs";
import { jest, describe, it, expect, beforeEach, beforeAll } from "@jest/globals";

const mockFindByCampus = jest.fn();
const mockFindByEmailUniv = jest.fn();
const mockCreateUniv = jest.fn();
const mockFindAllUniv = jest.fn();

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
        findByEmail: (...args) => mockFindByEmailUniv(...args),
        findByCampus: (...args) => mockFindByCampus(...args),
        findAll: (...args) => mockFindAllUniv(...args),
        findById: jest.fn().mockResolvedValue(null),
        create: (...args) => mockCreateUniv(...args),
        update: jest.fn(),
        delete: jest.fn(),
    }
}));

jest.unstable_mockModule("../src/models/Avaliacao.js", () => ({
    Avaliacao: {
        createOrUpdate: jest.fn(),
        getAverageRating: jest.fn(),
        findByUsuarioAndUniversidade: jest.fn(),
    }
}));

jest.unstable_mockModule("../src/database/connection.js", () => ({
    prisma: {
        universidade: { findMany: jest.fn().mockResolvedValue([]) }
    }
}));

let app;

beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret-key-for-jest";
    process.env.NODE_ENV = "test";

    const appModule = await import("../src/app.js");
    app = appModule.default;
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe("POST /universidades/cadastro", () => {
    it("deve cadastrar universidade com sucesso", async () => {
        mockFindByCampus.mockResolvedValue(null);
        mockFindByEmailUniv.mockResolvedValue(null);
        mockCreateUniv.mockResolvedValue({
            id: 1,
            nome: "Universidade Federal",
            sigla: "UFX",
            campus: "Campus Central",
            email: "contato@ufx.edu"
        });

        const res = await request(app)
            .post("/universidades/cadastro")
            .send({
                nome: "Universidade Federal",
                sigla: "UFX",
                campus: "Campus Central",
                email: "contato@ufx.edu",
                senha: "Senha123!"
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("nome", "Universidade Federal");
        expect(res.body).not.toHaveProperty("senha");
    });

    it("deve retornar 400 se campus já estiver cadastrado", async () => {
        mockFindByCampus.mockResolvedValue({ id: 1, campus: "Campus Central" });

        const res = await request(app)
            .post("/universidades/cadastro")
            .send({
                nome: "Outra Universidade",
                sigla: "OU",
                campus: "Campus Central",
                email: "outro@ufx.edu",
                senha: "Senha123!"
            });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
    });
});

describe("POST /universidades/login", () => {
    it("deve fazer login com sucesso e retornar cookie", async () => {
        const senhaHash = await bcrypt.hash("Senha123!", 10);
        mockFindByEmailUniv.mockResolvedValue({
            id: 1,
            nome: "Universidade Federal",
            email: "contato@ufx.edu",
            senha: senhaHash,
            sigla: "UFX",
            campus: "Campus Central"
        });

        const res = await request(app)
            .post("/universidades/login")
            .send({ email: "contato@ufx.edu", senha: "Senha123!" });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("user");
        expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("deve retornar 401 para credenciais inválidas", async () => {
        mockFindByEmailUniv.mockResolvedValue(null);

        const res = await request(app)
            .post("/universidades/login")
            .send({ email: "naoexiste@ufx.edu", senha: "Senha123!" });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty("error");
    });
});

describe("GET /universidades", () => {
    it("deve listar universidades", async () => {
        mockFindAllUniv.mockResolvedValue([
            { id: 1, nome: "UFX", sigla: "UFX", campus: "Campus Central" }
        ]);

        const res = await request(app).get("/universidades");

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
    });
});
