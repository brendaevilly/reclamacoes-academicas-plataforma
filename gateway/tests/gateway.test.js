import request from "supertest";

let app;

beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret-key";
    process.env.USERS_SERVICE_URL = "http://localhost:9999";
    process.env.COMPLAINTS_SERVICE_URL = "http://localhost:9998";
    process.env.INTERACTIONS_SERVICE_URL = "http://localhost:9997";
    process.env.NODE_ENV = "test";

    const appModule = await import("../src/app.js");
    app = appModule.default;
});

describe(" Headers de Segurança (Helmet)", () => {
    it("deve incluir o header X-Content-Type-Options", async () => {
        const res = await request(app).get("/health");
        expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });

    it("deve incluir o header X-Frame-Options", async () => {
        const res = await request(app).get("/health");
        expect(res.headers["x-frame-options"]).toBeDefined();
    });

    it("deve incluir o header X-XSS-Protection ou Content-Security-Policy", async () => {
        const res = await request(app).get("/health");
        const temCSP = res.headers["content-security-policy"] !== undefined;
        const temXXSS = res.headers["x-xss-protection"] !== undefined;
        expect(temCSP || temXXSS).toBe(true);
    });
});

describe("TA2 - Rate Limiting", () => {
    it("deve retornar 429 após exceder o limite de tentativas de login", async () => {
        // O limite de auth é 20 por 15 minutos
        const requests = Array.from({ length: 25 }, () =>
            request(app)
                .post("/auth/login")
                .send({ email: "teste@test.com", senha: "senha" })
        );

        const responses = await Promise.all(requests);
        const tooMany = responses.filter(r => r.status === 429);
        expect(tooMany.length).toBeGreaterThan(0);
    });

    it("deve incluir headers de rate limit nas respostas", async () => {
        const res = await request(app).get("/health");
        expect(res.headers["ratelimit-limit"] || res.headers["x-ratelimit-limit"]).toBeDefined();
    });
});

describe("Health Check", () => {
    it("deve retornar status ok", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("status", "ok");
    });
});
