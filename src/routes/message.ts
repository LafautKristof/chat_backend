import { Router } from "express";
import { sendMessage, getMessage } from "../controllers/messageController";

const router = Router();

router.post("/", sendMessage);
router.get("/:conversationId", getMessage);

export default router;
