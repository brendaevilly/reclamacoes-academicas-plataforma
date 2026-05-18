import { Router } from "express";
import { avaliacaoController } from "../controllers/avaliacaoController.js";
import { auth } from "../middlewares/auth.js";

const router = Router();

// Criar ou atualizar avaliação (requer autenticação)
router.post("/", auth, avaliacaoController.createOrUpdate);

// Buscar média de avaliações de uma universidade
router.get("/universidade/:id/media", avaliacaoController.getMedia);

// Buscar avaliação do usuário logado para uma universidade
router.get("/universidade/:id/usuario", auth, avaliacaoController.getByUsuario);

export default router;

