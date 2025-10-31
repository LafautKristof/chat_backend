// controllers/conversationController.ts
import { Request, Response } from "express";
import * as conversationService from "../services/conversationService";
import { io } from "../server";
export async function getConversations(req: Request, res: Response) {
    try {
        const userId = req.query.userId as string | undefined;
        const conversations = await conversationService.getConversations(
            userId
        );
        res.json(conversations);
    } catch (error) {
        console.error("Error loading conversations:", error);
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
}

export async function inviteUser(req: Request, res: Response) {
    try {
        const { conversationId } = req.params;
        const { userId } = req.body;
        const { participant, totalParticipants, isGroup } =
            await conversationService.inviteUserToConversation(
                conversationId,
                userId
            );

        // realtime broadcast naar iedereen in de room
        io.to(conversationId).emit("user_added", {
            conversationId,
            user: {
                id: participant.user.id,
                name: participant.user.name,
                image: participant.user.image,
            },
        });

        io.emit("conversation_update", {
            conversationId,
            user: participant.user,
            isGroup,
        });

        res.json({
            participant,
            totalParticipants,
            isGroup,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function getConversationById(req: Request, res: Response) {
    try {
        const conversation = await conversationService.getConversationById(
            req.params.id
        );
        if (!conversation) {
            return res.status(400).json({ error: "conversation not found" });
        }
        res.json(conversation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: " Failed to loadConversation" });
    }
}

export async function checkConversationIfExcist(req: Request, res: Response) {
    const { userA, userB } = req.query;
    if (!userA || !userB) {
        return res.status(400).json({ message: "Missing UserIds" });
    }
    try {
        const conversation =
            await conversationService.checkConversationIfExcist(
                userA as string,
                userB as string
            );
        if (conversation) {
            res.json({ conversationId: conversation.id });
        }
        res.json({ conversationId: null });
    } catch (error) {
        console.error("❌ checkConversationIfExcist error:", error);
        res.status(400).json({ message: "Internal Server Error" });
    }
}

export async function customizeConversation(req: Request, res: Response) {
    try {
        const { title, background } = req.body;
        const { id } = req.params;
        const update = await conversationService.customizeConversation(
            title,
            background,
            id
        );
        res.json(update);
    } catch (error) {
        console.error("❌ customizeConversation error:", error);
        res.status(400).json({ message: "Internal Server Error" });
    }
}

export async function leaveConversation(req: Request, res: Response) {
    try {
        const { conversationId } = req.params;
        const { userId } = req.body;

        const result = await conversationService.leaveConversation(
            conversationId,
            userId
        );

        // realtime broadcast
        io.to(conversationId).emit("user_left", {
            conversationId,
            userId,
        });

        res.json(result);
    } catch (error: any) {
        console.error("❌ leaveConversation error:", error);
        res.status(400).json({ error: error.message });
    }
}
