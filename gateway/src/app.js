import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "path";
import router from "./routes/index.js";

const app = express();
const frontendPath = path.join(process.cwd(), "../frontend");

// TA2: cabeçalhos HTTP de segurança via Helmet.
// CSP customizada para permitir as bibliotecas vindas de CDN
// (Bootstrap + Google Fonts), os <script> inline e os handlers
// onclick="..." usados em várias telas (ex.: telaprincipal.html,
//= telafeed.html, etc.). Sem `scriptSrcAttr: 'unsafe-inline'` o
// Helmet aplica o default `'none'`, que quebra todos os onclick.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net"
            ],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net",
                "https://fonts.googleapis.com"
            ],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'self'"]
        }
    },
    // Permite assets de CDN (Bootstrap, fonts) sem bloqueio CORP
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir frontend estático para que a aplicação rode no mesmo host/origem do gateway.
app.use(express.static(path.join(frontendPath)));

// Redireciona a raiz para /pages/login.html (e não usa sendFile direto),
// para que todos os redirects relativos do JS (ex.: window.location.href = 'telafeed.html')
// resolvam corretamente para /pages/telafeed.html.
app.get("/", (req, res) => {
    res.redirect("/pages/login.html");
});

// proteção contra forrrrça bruta e Dos
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 600, // navegar pela SPA dispara muitas chamadas; 600 é confortável
    standardHeaders: true,
    legacyHeaders: false,
    // Não aplicar o limit às rotas de check-de-sessão e contagem
    // de notificações (são chamadas em quase todo refresh de tela).
    skip: (req) => req.path === "/auth/me"
        || req.path === "/interactions/notificacoes/unread-count",
    message: {
        error: "Muitas requisições",
        message: "Você excedeu o limite de requisições. Tente novamente em 15 minutos."
    }
});

// Rate Limiting mais restrito para rotas de autenticação
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20,
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
