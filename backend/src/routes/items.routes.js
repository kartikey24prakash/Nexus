import express from "express";
import multer from "multer";
import {
  saveItem,
  getItems,
  getItemById,
  deleteItem,
  addHighlight,
  deleteHighlight,
} from "../controllers/items.controller.js";

const router = express.Router();

// multer — store PDF in memory as buffer (not on disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10mb max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only PDF and image files are allowed"), false)
    }
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────────
router.post("/", upload.single("file"), saveItem);           // save URL or PDF
router.get("/", getItems);                                    // get all items
router.get("/:id", getItemById);                              // get single + related
router.delete("/:id", deleteItem);                            // delete item
router.patch("/:id/highlight", addHighlight);                 // add highlight
router.delete("/:id/highlight/:highlightId", deleteHighlight);// remove highlight

export default router;