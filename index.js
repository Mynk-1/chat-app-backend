require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const addContact = require("./routes/addContact")
const conversationRouter = require('./routes/conversationRoutes')

const socketHandler = require('./sockets/socketHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: 'https://chat-app-mu-plum-19.vercel.app', // Replace with your frontend URL
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api', authRoutes);
app.use('/api',addContact);
app.use('/api',conversationRouter);

app.get("/",(req,res)=>{
     res.json({succes:"server started successfully"})
})

// Socket.io handling
socketHandler(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));