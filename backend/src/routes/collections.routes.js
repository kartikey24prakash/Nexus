import express from "express";
import {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  addItemToCollection,
  removeItemFromCollection,
} from "../controllers/collections.controller.js";

const router = express.Router();

router.post("/", createCollection);                         // create collection
router.get("/", getCollections);                            // get all collections
router.get("/:id", getCollectionById);                      // get single + its items
router.patch("/:id", updateCollection);                     // update name/color
router.delete("/:id", deleteCollection);                    // delete collection
router.patch("/:id/add-item", addItemToCollection);         // add item to collection
router.patch("/:id/remove-item", removeItemFromCollection); // remove item

export default router;