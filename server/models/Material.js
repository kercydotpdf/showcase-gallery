import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Material title is required"], trim: true },
    type: { type: String, enum: ["file", "link"], default: "file" },
    // For "link": an external URL. For "file": a data URL (small files only).
    url: { type: String, required: [true, "File or link is required"] },
    filename: { type: String, default: "" },
    size: { type: Number, default: 0 },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

materialSchema.index({ class: 1 });

export default mongoose.model("Material", materialSchema);
