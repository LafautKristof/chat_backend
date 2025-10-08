import { Router } from "express";
import {
    getConversations,
    inviteUser,
    getConversationById,
    checkConversationIfExcist,
    customizeConversation,
    leaveConversation,
} from "../controllers/conversationController";

const router = Router();

router.get("/", getConversations);
router.get("/check", checkConversationIfExcist);
router.get("/:id", getConversationById);
router.post("/:conversationId/invite", inviteUser);
router.put("/:id/customize", customizeConversation);
router.post("/:conversationId/leave", leaveConversation);

export default router;
