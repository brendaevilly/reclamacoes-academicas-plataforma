import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "path";
import router from "./routes/index.js";

const app = express();
const frontendPath = path.join(process.cwd(), "../frontend");

// configura cabeçalhos http de segurança
app.use(helmet());

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir frontend estático para que a aplicação rode no mesmo host/origem do gateway.
app.use(express.static(path.join(frontendPath)));
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "pages/login.html"));
});

// proteção contra força bruta e Dos
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Muitas requisições",
        message: "Você excedeu o limite de requisições. Tente novamente em 15 minutos."
    }
});

// Rate Limiting mais restrito para rotas de autenticação
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Muitas tentativas de login",
        message: "Você excedeu o limite de tentativas de login. Tente novamente em 15 minutos."
    }
});

app.use(globalLimiter);
app.use("/auth/login", authLimiter);
app.use("/universidades/login", authLimiter);
app.use("/auth/cadastro", authLimiter);

app.use("/", router);

export default app;
