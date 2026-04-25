const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

// MongoDB Connection (Using Environment Variable)
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log("QuickTalk Database Connected! ✅"))
    .catch((err) => console.log("DB Error: ", err));

const MessageSchema = new mongoose.Schema({
    user: String,
    message: String,
    time: String,
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", MessageSchema);

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

io.on("connection", async (socket) => {
    console.log(`User Connected: ${socket.id}`);

    try {
        const previousMessages = await Message.find().sort({ timestamp: 1 }).limit(100);
        socket.emit("load_messages", previousMessages);
    } catch (err) {
        console.log("Error loading messages:", err);
    }

    socket.on("send_message", async (data) => {
        io.emit("receive_message", data);
        try {
            const newMessage = new Message(data);
            await newMessage.save();
        } catch (err) {
            console.log("Error saving message:", err);
        }
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected");
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
