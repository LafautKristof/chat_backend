// services/conversationService.ts
import { prisma } from "../lib/prisma";

export async function getConversations(userId: string | undefined) {
    const conversations = await prisma.conversation.findMany({
        where: {
            participants: {
                some: {
                    userId,
                },
            },
        },
        orderBy: { updatedAt: "desc" },
        include: {
            participants: {
                include: { user: true }, // 👉 haal user info binnen
            },
            messages: {
                orderBy: { createdAt: "desc" }, // 👉 laatste bericht bovenaan
                take: 1, // enkel laatste bericht ophalen (scheelt data)
                include: { sender: true }, // eventueel ook de afzender erbij
            },
        },
    });

    return conversations;
}

export async function inviteUserToConversation(
    conversationId: string,
    userId: string
) {
    // 1️⃣ Check of de conversatie bestaat
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
    });
    if (!conversation) {
        throw new Error("conversation not found");
    }

    // 2️⃣ Check of user al deelnemer is
    const existing = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId },
    });
    if (existing) {
        throw new Error("user is already in this conversation");
    }

    // 3️⃣ Voeg nieuwe participant toe (met user included)
    const participant = await prisma.conversationParticipant.create({
        data: { conversationId, userId },
        include: { user: true },
    });

    // 4️⃣ Update eventueel naar groepschat
    const totalParticipants = await prisma.conversationParticipant.count({
        where: { conversationId },
    });

    let isGroup = conversation.isGroup;
    if (totalParticipants > 2 && !conversation.isGroup) {
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { isGroup: true },
        });
        isGroup = true; // ✅ correcte assignment
    }
    await prisma.message.create({
        data: {
            content: `${participant.user.name} is toegevoegd aan de chat.`,
            type: "system",
            conversationId,
            createdAt: new Date(),
        },
    });

    return { participant, totalParticipants, isGroup };
}

export async function getConversationById(conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
            participants: {
                include: { user: true },
            },
            messages: {
                include: { sender: true },
                orderBy: { createdAt: "desc" },
            },
        },
    });
    return conversation;
}

export async function checkConversationIfExcist(userA: string, userB: string) {
    const conversation = await prisma.conversation.findFirst({
        where: {
            isGroup: false,
            AND: [
                { participants: { some: { userId: userA } } },
                { participants: { some: { userId: userB } } },
            ],
        },
        select: { id: true },
    });
    return conversation;
}

export async function customizeConversation(
    title: string,
    background: string,
    id: string
) {
    const conversation = await prisma.conversation.update({
        where: { id },
        data: {
            ...(title !== undefined && { title }),
            ...(background !== undefined && { background }),
        },
        select: { id: true, title: true, background: true },
    });
    return conversation;
}

export async function leaveConversation(
    conversationId: string,
    userId: string
) {
    // 1️⃣ Controleer of deelnemer bestaat
    const existing = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId },
        include: { user: true },
    });
    if (!existing) throw new Error("User is not part of this conversation");

    // 2️⃣ Haal de user op voor de system message
    const user = existing.user;

    // 3️⃣ Sla system message op vóór het verwijderen
    await prisma.message.create({
        data: {
            content: `${user.name} heeft de chat verlaten.`,
            type: "system",
            conversationId,
            createdAt: new Date(),
        },
    });

    // 4️⃣ Verwijder deelname
    await prisma.conversationParticipant.delete({
        where: { id: existing.id },
    });

    // 5️⃣ Controleer hoeveel deelnemers overblijven
    const remaining = await prisma.conversationParticipant.count({
        where: { conversationId },
    });

    if (remaining < 2) {
        // Verwijder het gesprek volledig als er minder dan 2 deelnemers overblijven
        await prisma.conversation.delete({
            where: { id: conversationId },
        });
    } else {
        // Anders: update gewoon de updatedAt zodat het gesprek omhoog schuift
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });
    }

    return { conversationId, remaining };
}
