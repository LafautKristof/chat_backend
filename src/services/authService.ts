import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import type {
    LoginData,
    OAuthData,
    RegisterData,
    SetPasswordData,
} from "../types/authTypes";

export async function register({ email, name, password }: RegisterData) {
    const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { name }] },
    });
    if (existingUser) {
        throw new Error("Email or username already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassword,
        },
    });
    return user;
}

export async function login({ email, password }: LoginData) {
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user || !user.password) {
        throw new Error("User not found");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error("Invalid password");
    }
    return user;
}

export async function oauthLogin({ email, name, image }: OAuthData) {
    let user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                name,
                image,
            },
        });
    }
    return { ...user, hasPassword: !!user.password };
}

export async function setPassword({ email, password }: SetPasswordData) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("user not found");
    if (user.password) throw new Error("user already has a password");
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserPassword = await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
    });
    return newUserPassword;
}

export async function getUserByEmail(email: string) {
    try {
        const user = await prisma.user.findUnique({ where: { email } });

        return user;
    } catch (err: any) {
        console.error("❌ Prisma error in getUserByEmail:", err.message, err);
        throw err;
    }
}
