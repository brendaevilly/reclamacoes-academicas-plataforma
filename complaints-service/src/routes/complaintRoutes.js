import { Router } from "express";
import complaintController from "../controllers/complaintController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import optionalAuthMiddleware from "../middleware/optionalAuthMiddleware.js";

const router = Router();

// Rotas específicas devem vir antes das rotas com parâmetros.
// Usamos optionalAuthMiddleware em /feed e /:id porque visitantes anônimos
// podem ver o feed, mas usuários logados precisam que `user_liked` seja
// calculado em relação a eles (caso contrário a UI mostra todo post como
// "não curtido" e o primeiro clique de um usuário que já tinha curtido
// acaba removendo a curtida — bug reportado).
router.get("/feed", optionalAuthMiddleware, complaintController.list);
router.post("/", authMiddleware, complaintController.create);
router.get("/:id", optionalAuthMiddleware, complaintController.findById);
router.put("/:id", authMiddleware, complaintController.update);
router.delete("/:id", authMiddleware, complaintController.delete);

export default router;