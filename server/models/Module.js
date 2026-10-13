import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Module title is required"], trim: true },
    description: { type: String, default: "", trim: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

moduleSchema.index({ class: 1, order: 1 });

export default mongoose.model("Module", moduleSchema);
