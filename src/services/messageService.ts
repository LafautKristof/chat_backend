import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export type FullMessage = Prisma.MessageGetPayload<{
    include: {
        sender: true;
        conversation: {
            include: { participants: { include: { user: true } } };
        };
    };
}>;

export type MessageData = {
    senderId: string;
    recipientId?: string;
    conversationId?: string;
    content: string;
    type?: "text" | "gif";
};

export async function sendMessage({
    senderId,
    recipientId,
    conversationId,
    content,
    type,
}: MessageData): Promise<FullMessage> {
    let convId = conversationId;

    if (!convId && recipientId) {
        const existing = await prisma.conversation.findFirst({
            where: {
                isGroup: false,
                AND: [
                    { participants: { some: { userId: senderId } } },
                    { participants: { some: { userId: recipientId } } },
                ],
            },
            include: { participants: true },
        });

        if (existing && existing.participants.length === 2) {
            convId = existing.id;
        } else {
            const newConv = await prisma.conversation.create({
                data: {
                    isGroup: false,
                    participants: {
                        create: [{ userId: senderId }, { userId: recipientId }],
                    },
                },
            });
            convId = newConv.id;
        }
    }

    if (!convId) {
        throw new Error("No conversationId or recipientId provided");
    }

    const detectedType =
        type ?? (content.match(/\.gif|tenor\.com/i) ? "gif" : "text");

    const message = await prisma.message.create({
        data: {
            content,
            senderId,
            conversationId: convId,
            type: detectedType,
        },
        include: {
            sender: true,
            conversation: {
                include: { participants: { include: { user: true } } },
            },
        },
    });
    await prisma.conversation.update({
        where: { id: convId },
        data: { updatedAt: new Date() },
    });

    return message;
}

export async function getMessage(conversationId: string) {
    const messages = await prisma.message.findMany({
        where: { conversationId },
        include: { sender: true },
        orderBy: { createdAt: "asc" },
    });
    return messages;
}
