import { Router } from "express";
import complaintController from "../controllers/complaintController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

// Rotas específicas devem vir antes das rotas com parâmetros
router.get("/feed", complaintController.list);
router.post("/", authMiddleware, complaintController.create);
router.get("/:id", complaintController.findById);
router.put("/:id", authMiddleware, complaintController.update);
router.delete("/:id", authMiddleware, complaintController.delete);

export default router;