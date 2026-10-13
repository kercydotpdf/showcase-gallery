import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Class/section name is required"], trim: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    schedule: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

classSchema.index({ teacher: 1 });
classSchema.index({ students: 1 });

export default mongoose.model("Class", classSchema);
