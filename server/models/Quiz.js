import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: {
      type: [String],
      validate: [(v) => v.length >= 2 && v.length <= 6, "A question needs 2-6 options"],
      required: true,
    },
    // Index of the correct option. Never returned to students.
    correct: { type: Number, required: true, min: 0 },
    points: { type: Number, default: 1, min: 0 },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Quiz title is required"], trim: true },
    instructions: { type: String, default: "" },
    dueDate: { type: Date, default: null },
    questions: { type: [questionSchema], default: [] },
    allowRetake: { type: Boolean, default: false },
    // Show the score right after submitting.
    showResult: { type: Boolean, default: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

quizSchema.index({ class: 1 });

quizSchema.virtual("totalPoints").get(function () {
  return this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
});

// Strips correct answers before the document is sent to a student.
quizSchema.methods.forStudent = function () {
  const obj = this.toObject({ virtuals: false });
  obj.questions = obj.questions.map((q) => {
    const { correct, ...rest } = q;
    return rest;
  });
  return obj;
};

export default mongoose.model("Quiz", quizSchema);
