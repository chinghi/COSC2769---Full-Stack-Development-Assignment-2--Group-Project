import dotenv from "dotenv";
import express from 'express';
import mongoose from 'mongoose';
import cors from "cors";
import authRoutes from './routes/authRoutes.js'
import groupRoutes from './routes/groupRoutes.js';
import User from './models/User.js';
import bcrypt from 'bcrypt';
import postRoutes from './routes/postRoutes.js'


dotenv.config();
const mongoURI = process.env.MONGODB_URI;
const app = express();

const corsOptions = {
    origin: true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(express.json({ limit: '50mb' })); // 요청 크기 제한을 50MB로 설정
app.use(express.urlencoded({ limit: '50mb', extended: true })); // 요청 크기 제한을 50MB로 설정

// MongoDB connection
const connect = async () => {
    try {
        await mongoose.connect(mongoURI, {});
        console.log("MongoDB is connected");
    } catch (err) {
        console.error("MongoDB connection error:", err.message);
    }
};

// Middleware
app.use(express.json({ limit: '50mb' })); // Increase the body size limit for large image uploads
app.use(cors(corsOptions));

// Routes
app.get('/', (req, res) => {
    res.send('Hello from Express!');
});
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api', postRoutes);



app.listen(process.env.PORT || 3000, () => {
    connect();
    console.log("Server is running on port 3000");
});
