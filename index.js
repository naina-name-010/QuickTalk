const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
    .then(() => console.log("QuickTalk Database Connected! ✅"))
    .catch((err) => console.log("DB Error: ", err));

// Message Schema
const Message = mongoose.model("Message", new mongoose.Schema({
    user: String, message: String, time: String, timestamp: { type: Date, default: Date.now }
}));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- यह हिस्सा सबसे ज़रूरी है ---
// यह कोड सर्वर को बताएगा कि index.html कहाँ है
app.use(express.static(path.join(__dirname, "../client")));

app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client", "index.html"));
});

io.on("connection", async (socket) => {
    try {
        const previousMessages = await Message.find().sort({ timestamp: 1 }).limit(100);
        socket.emit("load_messages", previousMessages);
    } catch (err) { console.log(err); }

    socket.on("send_message", async (data) => {
        io.emit("receive_message", data);
        try {
            const newMessage = new Message(data);
            await newMessage.save();
        } catch (err) { console.log(err); }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
