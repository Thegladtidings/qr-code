import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";

// Routes
import authRoutes from "./routes/authRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";



dotenv.config();
const app = express();

// Middleware
const allowedOrigins = [
  'https://vtu-app-mih3.onrender.com',
  'https://qr-code-040t.onrender.com', // Backend server
  'http://localhost:5000', // Local backend server
  'http://localhost:19000', // Expo Go app (mobile)
  'http://localhost:8081', // User app (mobile)
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'PATCH', 'POST', 'PUT', 'DELETE'], // ✅ Fix here
  credentials: true,
}));
app.use(bodyParser.json());

// Connect MongoDB
mongoose.connect(process.env.MONGODB_URL)
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.error("❌ MongoDB Error:", err));

// Routes
app.use("/api/auth", authRoutes);                // register/login
app.use("/api/exam-assignments", examRoutes); // exam assignment & attendance
app.use("/api/admin", adminRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.send("Exam Management API is running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
