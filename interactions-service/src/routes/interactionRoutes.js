import { Router } from "express";
import interactionController from "../controllers/interactionController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import optionalAuthMiddleware from "../middlewares/optionalAuthMiddleware.js";

const router = Router();

// ========== ROTAS DE COMENTÁRIOS ==========

router.post("/comentarios", authMiddleware, interactionController.createComentario);
router.get("/comentarios/reclamacao/:reclamacaoId", optionalAuthMiddleware, interactionController.getComentariosByReclamacao);
router.put("/comentarios/:id", authMiddleware, interactionController.updateComentario);
router.delete("/comentarios/:id", authMiddleware, interactionController.deleteComentario);

// ========== ROTAS DE NOTIFICAÇÕES (TB2 + TB3) ==========

// Listar notificações do usuário/universidade logado (suporta ?lida=false e paginação)
router.get("/notificacoes", authMiddleware, interactionController.getNotificacoes);

// Contagem de não lidas (útil para badge no header)
router.get("/notificacoes/unread-count", authMiddleware, interactionController.getUnreadCount);

// Marcar uma notificação específica como lida
router.put("/notificacoes/:id/read", authMiddleware, interactionController.markNotificacaoAsRead);

// Marcar todas as notificações como lidas
router.put("/notificacoes/read-all", authMiddleware, interactionController.markAllNotificacoesAsRead);

// Endpoint INTERNO (chamado pelo complaints-service via x-internal-key)
router.post("/internal/notificacoes/nova-reclamacao", interactionController.createNotificacaoInterna);

// ========== ROTAS DE LIKES ==========

router.post("/likes/reclamacao", authMiddleware, interactionController.toggleLikeReclamacao);
router.post("/likes/comentario", authMiddleware, interactionController.toggleLikeComentario);

export default router;
