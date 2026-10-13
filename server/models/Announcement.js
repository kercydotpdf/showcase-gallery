import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Announcement title is required"], trim: true },
    content: { type: String, required: [true, "Announcement text is required"] },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

announcementSchema.index({ class: 1, createdAt: -1 });

export default mongoose.model("Announcement", announcementSchema);
