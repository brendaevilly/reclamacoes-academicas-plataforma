import { Router } from "express";
import proxyService from "../services/proxyService.js";

const router = Router();

/**
 * Rota para encaminhar chamadas ao microserviço de usuários
 */
router.use("/users", (req, res) => {
    proxyService(req, res, process.env.USERS_SERVICE_URL);
});

/**
 * Rota para denúncias
 */
router.use("/complaints", (req, res) => {
    proxyService(req, res, process.env.COMPLAINTS_SERVICE_URL);
});

/**
 * Rota para interações
 */
router.use("/interactions", (req, res) => {
    proxyService(req, res, process.env.INTERACTIONS_SERVICE_URL);
});

export default router;
