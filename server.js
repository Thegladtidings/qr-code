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
app.use(cors());
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
