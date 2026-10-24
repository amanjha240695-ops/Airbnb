import express from "express";
import cors from "cors";
import path from "path"; // <-- [ADDED] Node.js path module for resolving file locations
import { fileURLToPath } from "url"; // <-- [ADDED] Helper to get directory path in ES Modules

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import { errorResponse } from "./utils/response.js";
import hostRoutes from "./routes/hostRoutes.js";
// [ADDED] Derive __dirname for ES module scope (points to server/src)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Core Middlewares
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation"), false);
    },
    credentials: true,
  })
);

app.use(express.json());

// 2. Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// 3. API Feature Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/host", hostRoutes);
// ============================================================================
// [ADDED] Demo Payment Simulator Route
// Serves test-payment.html located in the backend root directory (../)
// Must be placed BEFORE the 404 handler so Express matches it first!
// ============================================================================
app.get("/test-payment", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../test-payment.html"));
});

// 4. 404 Route Handler
app.use((req, res) => {
  return errorResponse(res, 404, `Route ${req.originalUrl} not found`);
});

// 5. Global Error Handling Middleware
app.use(errorHandler);

export default app;