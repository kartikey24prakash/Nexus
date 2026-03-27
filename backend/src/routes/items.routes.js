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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"), false);
    }
  },
});

router.post("/", upload.single("file"), saveItem);
router.get("/", getItems);
router.get("/:id", getItemById);
router.delete("/:id", deleteItem);
router.patch("/:id/highlight", addHighlight);
router.delete("/:id/highlight/:highlightId", deleteHighlight);

export default router;
