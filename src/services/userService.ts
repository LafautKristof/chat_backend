import { prisma } from "../lib/prisma";

export async function getUsers(excludeId?: string | undefined) {
    const users = await prisma.user.findMany({
        where: excludeId ? { id: { not: excludeId } } : {},
        select: { id: true, name: true, email: true, image: true },
    });

    return users;
}

export async function getUsersById(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    return user;
}

export async function searchUsers(name: string) {
    if (!name?.trim()) return [];
    const user = await prisma.user.findMany({
        where: {
            name: { contains: name, mode: "insensitive" },
        },
        select: { id: true, name: true, image: true },
        take: 10,
    });
    return user;
}
