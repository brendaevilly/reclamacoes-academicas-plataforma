import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";

const app = express();


app.use(helmet());
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
