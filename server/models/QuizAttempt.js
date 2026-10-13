import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: [{ type: Number, default: null }],
    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    attempt: { type: Number, default: 1 },
    takenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ quiz: 1, student: 1, attempt: 1 }, { unique: true });
quizAttemptSchema.index({ class: 1, student: 1 });

export default mongoose.model("QuizAttempt", quizAttemptSchema);
