import { Router } from "express";
import complaintController from "../controllers/complaintController.js";

const router = Router();

router.post("/", complaintController.create);
router.get("/", complaintController.list);

export default router;
