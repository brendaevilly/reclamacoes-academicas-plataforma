import { Router } from "express";
import complaintController from "../controllers/complaintController.js";
import authMiddleware from "../middleware/authMiddleware.js";

import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/student/:alunoId', authenticateToken, async (req, res) => {
    try {
        const { alunoId } = req.params;

        // Verificar permissão
        if (req.user.id !== parseInt(alunoId) && req.user.role !== 'admin') {
            return res.status(403).json({
                message: "Você não tem permissão para ver reclamações de outros usuários."
            });
        }

        const result = await complaintsService.findByStudentId(alunoId, req.query);
        res.status(result.status).json(result);
    } catch (error) {
        console.error('Erro ao buscar reclamações do aluno:', error);
        res.status(500).json({ message: "Erro no servidor." });
    }
});

// Rotas específicas devem vir antes das rotas com parâmetros
router.get("/feed", complaintController.list);
router.post("/", authenticateToken, complaintController.create);
router.get("/:id", complaintController.findById);
router.put("/:id", authenticateToken, complaintController.update);
router.delete("/:id", authenticateToken, complaintController.delete);

export default router;