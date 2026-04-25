const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path"); // फाइल पाथ के लिए ज़रूरी है
const { Server } = require("socket.io");

const app = express();
app.use(cors());

// --- 1. FRONTEND FILES CONNECT KARNA ---
// यह लाइन रेंडर को बताती है कि हमारी 'client' फोल्डर की फाइल्स कहाँ हैं
app.use(express.static(path.join(__dirname, "../client")));

// MongoDB Connection
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

// --- 2. CATCH-ALL ROUTE ---
// अगर कोई भी लिंक खोलेगा, तो उसे index.html ही दिखेगी
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client", "index.html"));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
