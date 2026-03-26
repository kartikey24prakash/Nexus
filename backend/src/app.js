import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import errorMiddleware from "./middleware/error.middleware.js";
import authMiddleware from "./middleware/Auth.middleware.js";
import cookieParser from "cookie-parser";



// Routes
// import authRoutes from "./routes/auth.routes.js";
import authRoutes from "./routes/Auth.routes.js"
import itemsRoutes from "./routes/items.routes.js";
import searchRoutes from "./routes/search.routes.js";
import graphRoutes from "./routes/graph.routes.js";
import collectionsRoutes from "./routes/collections.routes.js";
import resurfaceRoutes from "./routes/resurface.routes.js";
// import resurfaceRoutes from "./routes/resurfaceRoute.js";

dotenv.config();

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:5173",     // Vite React dev server
      "http://localhost:3000",
      "chrome-extension://flhhajpghloejheffojcemcnimbdbfii",      // Browser extension
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// ─── Health check (public) ────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", project: "Nexus", timestamp: new Date() });
});

// ─── Public routes ────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);

// ─── Protected routes (all require JWT) ──────────────────────────────────────
app.use("/api/items", authMiddleware, itemsRoutes);
app.use("/api/search", authMiddleware, searchRoutes);
app.use("/api/graph", authMiddleware, graphRoutes);
app.use("/api/collections", authMiddleware, collectionsRoutes);
app.use("/api/resurface", authMiddleware, resurfaceRoutes);


// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorMiddleware);

export default app;