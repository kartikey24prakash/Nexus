import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    color: { type: String, default: "#6366f1" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: item count ───────────────────────────────────────────────────────
// Lets you do collection.itemCount after populating
// Actual count is fetched via Item.countDocuments({ collection: id })
collectionSchema.virtual("itemCount", {
  ref: "Item",
  localField: "_id",
  foreignField: "collection",
  count: true,
});

const Collection = mongoose.models.Collection || mongoose.model("Collection", collectionSchema);

export default Collection;