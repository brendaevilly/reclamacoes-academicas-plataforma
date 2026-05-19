import { Router } from "express";
import { universidadeController } from "../controllers/universidadeController.js";
import { auth } from "../middlewares/auth.js";

const router = Router();

router.post("/cadastro", universidadeController.cadastro);
router.post("/login", universidadeController.login);

router.get("/", universidadeController.list);
router.get("/:id", universidadeController.findOne);
router.put("/:id", auth, universidadeController.update);
router.delete("/:id", auth, universidadeController.delete);

export default router;
