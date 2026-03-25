import dotenv from "dotenv";
dotenv.config();
import "./src/models/collection.model.js";
import "./src/models/item.model.js";
import "./src/models/user.model.js";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { startResurfaceJob } from "./src/jobs/resurface.job.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Start background jobs
  startResurfaceJob();

  // 3. Start Express server
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════╗
║        Nexus Backend Running         ║
║   http://localhost:${PORT}              ║
╚══════════════════════════════════════╝
    `);
  });
};

startServer();