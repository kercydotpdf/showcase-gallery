import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Subject code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: { type: String, required: [true, "Subject title is required"], trim: true },
    description: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Subject", subjectSchema);
