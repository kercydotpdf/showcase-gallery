import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Assignment title is required"], trim: true },
    instructions: { type: String, default: "" },
    dueDate: { type: Date, default: null },
    points: { type: Number, default: 100, min: 0 },
    attachments: [{ name: String, url: String }],
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

assignmentSchema.index({ class: 1, dueDate: 1 });

export default mongoose.model("Assignment", assignmentSchema);
