import { Router } from "express";
import interactionController from "../controllers/interactionController.js";

const router = Router();

router.post("/", interactionController.create);
router.get("/", interactionController.list);

export default router;
