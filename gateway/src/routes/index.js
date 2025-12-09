import { Router } from "express";
import proxyService from "../services/proxyService.js";

const router = Router();

/**
 * Rota para encaminhar chamadas ao microserviço de usuários
 * Rotas: /auth/*, /universidades/*
 */
router.use("/auth", (req, res) => {
    proxyService(req, res, process.env.USERS_SERVICE_URL, "/auth");
});

router.use("/universidades", (req, res) => {
    proxyService(req, res, process.env.USERS_SERVICE_URL, "/universidades");
});

router.use("/avaliacoes", (req, res) => {
    proxyService(req, res, process.env.USERS_SERVICE_URL, "/avaliacoes");
});

/**
 * Rota para reclamações
 * Rotas: /complaints/*
 */
router.use("/complaints", (req, res) => {
    proxyService(req, res, process.env.COMPLAINTS_SERVICE_URL, "/complaints");
});

/**
 * Rota para interações (comentários e notificações)
 * Rotas: /interactions/*
 */
router.use("/interactions", (req, res) => {
    proxyService(req, res, process.env.INTERACTIONS_SERVICE_URL, "/interactions");
});

/**
 * Rota de health check
 */
router.get("/health", (req, res) => {
    res.json({ 
        status: "ok", 
        message: "Gateway está funcionando",
        services: {
            users: process.env.USERS_SERVICE_URL,
            complaints: process.env.COMPLAINTS_SERVICE_URL,
            interactions: process.env.INTERACTIONS_SERVICE_URL
        }
    });
});

export default router;
