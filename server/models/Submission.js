import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default: "" },
    file: { name: { type: String, default: "" }, url: { type: String, default: "" } },
    status: { type: String, enum: ["submitted", "graded"], default: "submitted" },
    grade: { type: Number, default: null },
    feedback: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },
    gradedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One submission per student per assignment (prevents duplicates).
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);
