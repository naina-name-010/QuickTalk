const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

// --- 1. MongoDB Connection (Standard String to fix ECONNREFUSED) ---
// Replace username, password and your cluster name carefully
const MONGO_URI = "mongodb://project997700_db_user:finance_pswd100@cluster0-shard-00-00.4zqrbs8.mongodb.net:27017,cluster0-shard-00-01.4zqrbs8.mongodb.net:27017,cluster0-shard-00-02.4zqrbs8.mongodb.net:27017/QuickTalk?ssl=true&replicaSet=atlas-13o890-shard-0&authSource=admin&retryWrites=true&w=majority";


mongoose.connect(MONGO_URI)
    .then(() => console.log("QuickTalk Database Connected! ✅"))
    .catch((err) => {
        console.log("❌ DB Error: ", err.message);
        console.log("Tip: If error persists, please change your DNS to 8.8.8.8 or use Mobile Hotspot.");
    });

// --- 2. Message Schema ---
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

// --- 3. Socket Logic ---
io.on("connection", async (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Load old messages from DB when a user connects
    try {
        const previousMessages = await Message.find().sort({ timestamp: 1 }).limit(100);
        socket.emit("load_messages", previousMessages);
    } catch (err) {
        console.log("Error loading messages:", err.message);
    }

    // Save and Send New Message
    socket.on("send_message", async (data) => {
        // Instant emit so chat works even if DB is slow
        io.emit("receive_message", data);

        // Save to Database in background
        try {
            const newMessage = new Message(data);
            await newMessage.save();
        } catch (err) {
            console.log("Message sent but not saved to DB:", err.message);
        }
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected");
    });
});

// 'const PORT = 5000' वाली लाइन को हटाकर ये लिखें:
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT} 🚀`);
});

});
