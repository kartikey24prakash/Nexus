import cron from "node-cron";
import Item from "../models/item.model.js";

// Picks a random item saved 7+ days ago (per user) and stamps resurfacedAt
// Runs every hour — but only resurfaces items not shown in the last 24h

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY    = 24 * 60 * 60 * 1000;

export const getResurfaceItemForUser = async (userId) => {
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS);
  const oneDayAgo    = new Date(Date.now() - ONE_DAY);

  // Find items older than 7 days that haven't been resurfaced in 24h (or never)
  const candidates = await Item.find({
    user: userId,
    createdAt: { $lte: sevenDaysAgo },
    $or: [
      { resurfacedAt: null },
      { resurfacedAt: { $lte: oneDayAgo } },
    ],
  }).select("_id title url type thumbnail tags resurfacedAt createdAt");

  if (!candidates.length) return null;

  // Pick a random one
  const item = candidates[Math.floor(Math.random() * candidates.length)];

  // Stamp it
  await Item.findByIdAndUpdate(item._id, { resurfacedAt: new Date() });

  return item;
};

// Cron job — runs every hour, pre-warms resurface for all users
// (optional background work — the real serving happens via the API endpoint)
export const startResurfaceJob = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("[Resurface Job] Running hourly check...");
    try {
      const { default: User } = await import("../models/user.model.js");
      const users = await User.find({}).select("_id");
      for (const user of users) {
        await getResurfaceItemForUser(user._id);
      }
      console.log(`[Resurface Job] Processed ${users.length} users`);
    } catch (err) {
      console.error("[Resurface Job] Error:", err.message);
    }
  });
  console.log("[Resurface Job] Scheduled — runs every hour");
};
