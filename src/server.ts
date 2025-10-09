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

app.use(
    cors({
        origin: [
            "https://chat-frontend-6ja0kmfzu-kristoflafauts-projects.vercel.app",
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

    // 🔹 Join/leave rooms
    socket.on("join_conversation", (conversationId) => {
        socket.join(conversationId);
        console.log(`➡️ User joined room ${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId) => {
        socket.leave(conversationId);
        console.log(`⬅️ User left room ${conversationId}`);
    });

    // ✏️ Typing events
    socket.on("typing", (data) => {
        socket.broadcast.to(data.conversationId).emit("typing", data);
    });

    socket.on("stop_typing", (data) => {
        socket.broadcast.to(data.conversationId).emit("stop_typing", data);
    });

    // 💬 Bericht verzonden
    socket.on("message", (msg) => {
        io.to(msg.conversationId).emit("message", msg);
    });

    // 👥 Gebruiker toegevoegd aan gesprek
    socket.on("user_added", ({ conversationId, user }) => {
        const userName = user?.name || "Onbekende gebruiker";
        console.log(`✅ ${userName} toegevoegd aan gesprek ${conversationId}`);

        // Broadcast systeemmelding
        io.to(conversationId).emit("system_message", {
            conversationId,
            message: `${userName} is toegevoegd aan de chat.`,
            type: "user_added",
        });

        // Eventueel lijst updaten
        io.emit("conversation_update", { conversationId, user });
    });

    // 🚪 Gebruiker heeft gesprek verlaten
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
