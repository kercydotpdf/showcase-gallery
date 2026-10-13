import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Lesson title is required"], trim: true },
    content: { type: String, default: "" },
    module: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

lessonSchema.index({ module: 1, order: 1 });

export default mongoose.model("Lesson", lessonSchema);
