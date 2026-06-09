

import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { jest, describe, test, expect, beforeEach } from "@jest/globals";
// ---- Mocks dos módulos de banco de dados ----
// Precisamos mockar antes de importar os módulos que os usam
const mockFindByEmail = jest.fn();
const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();

jest.unstable_mockModule("../src/models/User.js", () => ({
    User: {
        findByEmail: (...args) => mockFindByEmail(...args),
        findById: (...args) => mockFindById(...args),
        create: (...args) => mockCreate(...args),
        update: (...args) => mockUpdate(...args),
        findAll: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue(true),
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

// Importar app após os mocks
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

// =============================================
// CADASTRO DE USUÁRIO
// =============================================
describe("POST /auth/cadastro", () => {

    it("deve cadastrar um novo usuário com sucesso", async () => {
        mockFindByEmail.mockResolvedValue(null); // usuário não existe

        mockCreate.mockResolvedValue({
            id: 1,
            nome: "João Silva",
            email: "joao@test.com",
            criadoEm: new Date()
        });

        const res = await request(app)
            .post("/auth/cadastro")
            .send({
                nome: "João Silva",
                email: "joao@test.com",
                senha: "Senha123!"
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("email", "joao@test.com");
        expect(res.body).not.toHaveProperty("senha");
    });

    it("deve retornar 400 se o e-mail já estiver cadastrado", async () => {
        mockFindByEmail.mockResolvedValue({
            id: 1,
            nome: "Usuário Existente",
            email: "joao@test.com",
            senha: "hash"
        });

        const res = await request(app)
            .post("/auth/cadastro")
            .send({
                nome: "João Silva",
                email: "joao@test.com",
                senha: "Senha123!"
            });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
    });

    it("deve retornar erro de validação se campos obrigatórios faltarem", async () => {
        const res = await request(app)
            .post("/auth/cadastro")
            .send({
                email: "joao@test.com"
            });

        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("deve retornar erro se e-mail for inválido", async () => {
        const res = await request(app)
            .post("/auth/cadastro")
            .send({
                nome: "João",
                email: "email-invalido",
                senha: "Senha123!"
            });

        expect(res.status).toBeGreaterThanOrEqual(400);
    });

});
// =============================================
// LOGIN DE USUÁRIO
// =============================================
describe("POST /auth/login", () => {
    it("deve fazer login com sucesso e retornar cookie HttpOnly", async () => {
        const senhaHash = await bcrypt.hash("Senha123!", 10);
        mockFindByEmail.mockResolvedValue({
            id: 1,
            nome: "João Silva",
            email: "joao@test.com",
            senha: senhaHash
        });

        const res = await request(app)
            .post("/auth/login")
            .send({ email: "joao@test.com", senha: "Senha123!" });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("user");
        expect(res.body.user).toHaveProperty("email", "joao@test.com");
        expect(res.body).not.toHaveProperty("token"); // TA1: token não deve estar no body

        // TA1: Verificar que o cookie foi definido
        const cookies = res.headers["set-cookie"];
        expect(cookies).toBeDefined();
        const tokenCookie = cookies.find(c => c.startsWith("token="));
        expect(tokenCookie).toBeDefined();
        expect(tokenCookie).toContain("HttpOnly"); // TA1: deve ser HttpOnly
    });

    it("deve retornar 401 para senha incorreta", async () => {
        const senhaHash = await bcrypt.hash("senha-correta", 10);
        mockFindByEmail.mockResolvedValue({
            id: 1,
            nome: "João Silva",
            email: "joao@test.com",
            senha: senhaHash
        });

        const res = await request(app)
            .post("/auth/login")
            .send({ email: "joao@test.com", senha: "senha-errada" });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty("error");
    });

    it("deve retornar 401 para e-mail não cadastrado", async () => {
        mockFindByEmail.mockResolvedValue(null);

        const res = await request(app)
            .post("/auth/login")
            .send({ email: "naoexiste@test.com", senha: "Senha123!" });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty("error");
    });

    it("deve retornar erro de validação se campos faltarem", async () => {
        const res = await request(app)
            .post("/auth/login")
            .send({ email: "joao@test.com" }); // sem senha

        expect(res.status).toBeGreaterThanOrEqual(400);
    });
});

// =============================================
// LOGOUT
// =============================================
describe("POST /auth/logout", () => {

    it("deve fazer logout e limpar o cookie", async () => {

        const senhaHash = await bcrypt.hash("Senha123!", 10);

        mockFindByEmail.mockResolvedValue({
            id: 1,
            nome: "João Silva",
            email: "joao@test.com",
            senha: senhaHash
        });

        // LOGIN
        const loginRes = await request(app)
            .post("/auth/login")
            .send({
                email: "joao@test.com",
                senha: "Senha123!"
            });

        const cookies = loginRes.headers["set-cookie"];

        // LOGOUT autenticado
        const res = await request(app)
            .post("/auth/logout")
            .set("Cookie", cookies);

        expect(res.status).toBe(200);

        const logoutCookies = res.headers["set-cookie"];

        if (logoutCookies) {
            const tokenCookie = logoutCookies.find(c =>
                c.startsWith("token=")
            );

            if (tokenCookie) {
                expect(tokenCookie).toContain("Expires=");
            }
        }
    });

});

// =============================================
// TA4: TROCA DE SENHA
// =============================================
describe("PUT /auth/:id/senha", () => {
    it("deve exigir autenticação para trocar senha", async () => {
        const res = await request(app)
            .put("/auth/1/senha")
            .send({ senhaAtual: "old", novaSenha: "new123" });

        expect(res.status).toBe(401);
    });
});

// =============================================
// SESSÃO DO USUÁRIO
// =============================================
describe("GET /auth/me", () => {
    it("deve retornar 401 sem autenticação", async () => {
        const res = await request(app).get("/auth/me");

        expect(res.status).toBe(401);
    });

    it("deve retornar dados do usuário autenticado", async () => {
        mockFindById.mockResolvedValue({
            id: 1,
            nome: "João Silva",
            email: "joao@test.com"
        });

        const token = jwt.sign(
            { id: 1, email: "joao@test.com" },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        const res = await request(app)
            .get("/auth/me")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("user");
        expect(res.body.user).toHaveProperty("email", "joao@test.com");
    });
});
