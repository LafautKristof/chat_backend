import { Request, Response } from "express";
import * as messageService from "../services/messageService";
import { io } from "../server";

export async function sendMessage(req: Request, res: Response) {
    try {
        const { senderId, recipientId, conversationId, content, type } =
            req.body;
        const message = await messageService.sendMessage({
            senderId,
            recipientId,
            conversationId,
            content,
            type,
        });

        io.to(message.conversationId).emit("message", {
            ...message,
            conversationId: message.conversationId,
        });

        io.emit("conversation_update", {
            conversationId: message.conversationId,
            content: message.content,
            createdAt: message.createdAt,
            participants: message.conversation.participants,
        });

        res.json(message);
    } catch (error) {
        console.error(error);
        res.status(400).send(error);
    }
}

export async function getMessage(req: Request, res: Response) {
    try {
        const messages = await messageService.getMessage(
            req.params.conversationId
        );
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(400).send(error);
    }
}
