import { getResurfaceItemForUser } from "../jobs/resurface.job.js";

// GET /api/resurface
export const getResurfaceItem = async (req, res) => {
  try {
    const item = await getResurfaceItemForUser(req.user._id);

    if (!item) {
      return res.status(200).json({ item: null, message: "Nothing to resurface yet" });
    }

    res.status(200).json({ item });
  } catch (err) {
    console.error("[Resurface] Error:", err.message);
    res.status(500).json({ error: "Failed to get resurface item" });
  }
};