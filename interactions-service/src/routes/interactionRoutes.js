import { Router } from "express";
import interactionController from "../controllers/interactionController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = Router();

// ========== ROTAS DE COMENTÁRIOS ==========

// Criar comentário (requer autenticação)
router.post("/comentarios", authMiddleware, interactionController.createComentario);

// Buscar comentários de uma reclamação (público)
router.get("/comentarios/reclamacao/:reclamacaoId", interactionController.getComentariosByReclamacao);

// Atualizar comentário (requer autenticação e ser o autor)
router.put("/comentarios/:id", authMiddleware, interactionController.updateComentario);

// Deletar comentário (requer autenticação e ser o autor)
router.delete("/comentarios/:id", authMiddleware, interactionController.deleteComentario);

// ========== ROTAS DE NOTIFICAÇÕES ==========

// Buscar notificações do usuário/universidade logado (requer autenticação)
router.get("/notificacoes", authMiddleware, interactionController.getNotificacoes);

// Marcar notificação como lida (requer autenticação)
router.patch("/notificacoes/:id/read", authMiddleware, interactionController.markNotificacaoAsRead);

// Marcar todas as notificações como lidas (requer autenticação)
router.patch("/notificacoes/read-all", authMiddleware, interactionController.markAllNotificacoesAsRead);

export default router;
