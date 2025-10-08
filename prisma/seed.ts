// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
// Kies hier het test-wachtwoord dat je voor ALLE seeded users wil gebruiken
const SEED_PASSWORD = process.env.SEED_PASSWORD || "secret123";

async function createOrUpdateUser(userData: {
    name: string;
    email: string;
    image?: string;
}) {
    const hashed = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);

    // upsert: create als niet bestaat, update password als wel bestaat
    const user = await prisma.user.upsert({
        where: { email: userData.email },
        create: {
            name: userData.name,
            email: userData.email,
            image: userData.image,
            password: hashed,
        },
        update: {
            // update enkel het password (maar je kunt hier ook name/image updaten indien gewenst)
            password: hashed,
        },
    });

    return user;
}

async function main() {
    console.log("🚀 Start seeding...");

    // USERS
    const usersData = [
        {
            name: "Kristof Lafaut",
            email: "kristof@example.com",
            image: "https://i.pravatar.cc/150?img=1",
        },
        {
            name: "Emma Janssens",
            email: "emma@example.com",
            image: "https://i.pravatar.cc/150?img=2",
        },
        {
            name: "Liam Peeters",
            email: "liam@example.com",
            image: "https://i.pravatar.cc/150?img=3",
        },
        {
            name: "Noah Vermeulen",
            email: "noah@example.com",
            image: "https://i.pravatar.cc/150?img=4",
        },
        {
            name: "Sofie De Smet",
            email: "sofie@example.com",
            image: "https://i.pravatar.cc/150?img=5",
        },
    ];

    const users = [];
    for (const u of usersData) {
        const created = await createOrUpdateUser(u);
        users.push(created);
    }

    // Map users voor gemak
    const kristof = users.find((u) => u.email === "kristof@example.com")!;
    const emma = users.find((u) => u.email === "emma@example.com")!;
    const liam = users.find((u) => u.email === "liam@example.com")!;
    const noah = users.find((u) => u.email === "noah@example.com")!;
    const sofie = users.find((u) => u.email === "sofie@example.com")!;

    // 1-OP-1 gesprek + berichten (UPSERT om duplicatie te vermijden)
    // Je kunt hier alternatieven gebruiken; hieronder een eenvoudige create indien nog niet aanwezig.
    const existing1 = await prisma.conversation.findFirst({
        where: {
            isGroup: false,
            participants: {
                some: { userId: kristof.id },
            },
        },
    });

    if (!existing1) {
        await prisma.conversation.create({
            data: {
                isGroup: false,
                participants: {
                    create: [{ userId: kristof.id }, { userId: emma.id }],
                },
                messages: {
                    create: [
                        {
                            senderId: kristof.id,
                            content: "Hey Emma! Alles goed?",
                        },
                        {
                            senderId: emma.id,
                            content: "Hey Kristof! Ja hoor, met jou?",
                        },
                    ],
                },
            },
        });
    }

    // Groepschat
    const existingGroup = await prisma.conversation.findFirst({
        where: {
            title: "Weekend Plan 🏕️",
        },
    });

    if (!existingGroup) {
        await prisma.conversation.create({
            data: {
                title: "Weekend Plan 🏕️",
                isGroup: true,
                participants: {
                    create: [
                        { userId: kristof.id },
                        { userId: liam.id },
                        { userId: noah.id },
                        { userId: sofie.id },
                    ],
                },
                messages: {
                    create: [
                        {
                            senderId: liam.id,
                            content: "Wie zorgt er voor het eten?",
                        },
                        { senderId: kristof.id, content: "Ik breng pizza 🍕" },
                        {
                            senderId: sofie.id,
                            content: "Top! Ik neem drank mee 🍹",
                        },
                    ],
                },
            },
        });
    }

    console.log("✅ Seed voltooid.");
    console.log("Seed password for all users:", SEED_PASSWORD);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
