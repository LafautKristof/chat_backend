import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
});

app.get("/", (req, res) => {
    res.send("Hello World!");
});

io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("chat_message", (msg) => {
        console.log("message received:", msg);
        io.emit("chat_message", msg);
    });

    socket.on("disconnect", () => {
        console.log("a user disconnected", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});
