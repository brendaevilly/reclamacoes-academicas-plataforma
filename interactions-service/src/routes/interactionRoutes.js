import { Router } from "express";
import interactionController from "../controllers/interactionController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import optionalAuthMiddleware from "../middlewares/optionalAuthMiddleware.js";

const router = Router();

// ========== ROTAS DE COMENTÁRIOS ==========

// Criar comentário (requer autenticação)
router.post("/comentarios", authMiddleware, interactionController.createComentario);

// Buscar comentários de uma reclamação (público, mas opcionalmente autenticado)
router.get("/comentarios/reclamacao/:reclamacaoId", optionalAuthMiddleware, interactionController.getComentariosByReclamacao);

// Atualizar comentário (requer autenticação e ser o autor)
router.put("/comentarios/:id", authMiddleware, interactionController.updateComentario);

// Deletar comentário (requer autenticação e ser o autor)
router.delete("/comentarios/:id", authMiddleware, interactionController.deleteComentario);

// ========== ROTAS DE LIKES ==========

// Toggle like em reclamação (requer autenticação)
router.post("/likes/reclamacao", authMiddleware, interactionController.toggleLikeReclamacao);

// Toggle like em comentário (requer autenticação)
router.post("/likes/comentario", authMiddleware, interactionController.toggleLikeComentario);

export default router;
