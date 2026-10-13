import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import apiRoutes from "./routes/index.js";

if (!process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET in server/.env");
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error("Missing MONGO_URI in server/.env");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:4173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / curl / server-to-server requests.
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "6mb" }));

app.get("/", (req, res) => {
  res.json({ message: "EduWow ELMS API is running", version: "1.0.0" });
});

app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = ["disconnected", "connected", "connecting", "disconnecting"][dbState] || "unknown";
  res.json({
    status: "ok",
    version: "1.0.0",
    uptime: Math.round(process.uptime()),
    database: dbStatus,
  });
});

app.use("/api", apiRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Central error handler
app.use((err, req, res, next) => {
  const status = err.status || (err.name === "ValidationError" ? 400 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ message: err.message || "Something went wrong" });
});

connectDB().then(() => {
  app.listen(PORT, () => console.log(`ELMS API running on port ${PORT}`));
});

export default app;
