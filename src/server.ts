import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import authRouter from "./routes/auth";
import conversationRouter from "./routes/conversation";
import userRouter from "./routes/user";
import messageRouter from "./routes/message";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(express.json());
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const INTERVAL_MINUTES = 30;

async function pingSupabase() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/?select=1`, {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
        });

        if (res.ok)
            console.log(
                `✅ Supabase responded OK at ${new Date().toLocaleTimeString()}`
            );
        else
            console.warn(
                `⚠️ Supabase returned ${res.status} ${res.statusText}`
            );
    } catch (err) {
        console.error("❌ Error pinging Supabase:", (err as Error).message);
    }
}

setInterval(pingSupabase, INTERVAL_MINUTES * 60 * 1000);
pingSupabase();
app.use(
    cors({
        origin: [
            "https://chat-frontend-one-steel.vercel.app",
            "http://localhost:3000",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
    })
);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use("/auth", authRouter);
app.use("/conversations", conversationRouter);
app.use("/users", userRouter);
app.use("/messages", messageRouter);

io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    socket.on("join_conversation", (conversationId) => {
        socket.join(conversationId);
        console.log(`➡️ User joined room ${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId) => {
        socket.leave(conversationId);
        console.log(`⬅️ User left room ${conversationId}`);
    });

    socket.on("typing", (data) => {
        socket.broadcast.to(data.conversationId).emit("typing", data);
    });

    socket.on("stop_typing", (data) => {
        socket.broadcast.to(data.conversationId).emit("stop_typing", data);
    });

    socket.on("message", (msg) => {
        io.to(msg.conversationId).emit("message", msg);
    });

    socket.on("user_added", ({ conversationId, user }) => {
        const userName = user?.name || "Onbekende gebruiker";
        console.log(`✅ ${userName} toegevoegd aan gesprek ${conversationId}`);

        io.to(conversationId).emit("system_message", {
            conversationId,
            message: `${userName} is toegevoegd aan de chat.`,
            type: "user_added",
        });

        io.emit("conversation_update", { conversationId, user });
    });

    socket.on("user_left", ({ conversationId, user }) => {
        console.log(`🚪 User ${user.name} heeft ${conversationId} verlaten`);

        io.to(conversationId).emit("system_message", {
            conversationId,
            message: `${user.name} heeft de chat verlaten.`,
            type: "user_left",
        });
    });

    socket.on("disconnect", () => {
        console.log("🔴 User disconnected", socket.id);
    });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
    console.log(`✅ Server listening on *:${PORT}`);
});
