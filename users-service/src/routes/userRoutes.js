import { Router } from "express";
import { userController } from "../controllers/userController.js";
import { auth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { cadastroSchema, loginSchema, idParamSchema } from "../validators/userValidator.js";

const router = Router();

router.post("/cadastro", validate(cadastroSchema, "body"), userController.cadastro);
router.post("/login", validate(loginSchema, "body"), userController.login);

router.get("/", auth, userController.list);
router.get("/:id", auth, validate(idParamSchema, "params"), userController.findOne);
router.put("/:id", auth, validate(idParamSchema, "params"), userController.update);
router.delete("/:id", auth, validate(idParamSchema, "params"), userController.delete);

export default router;
