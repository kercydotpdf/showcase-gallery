import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { HelpCircle, ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { PageHeader, Card } from "../../components/ui/Card";
import { Loading, ErrorAlert, Badge } from "../../components/ui/Feedback";
import Button from "../../components/ui/Button";
import { FormError } from "../../components/ui/Form";
import { useToast } from "../../components/ui/Toast";
import useAsync from "../../hooks/useAsync";
import { formatDate } from "../../api";
import * as api from "../../api";

export default function TakeQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: quiz, loading, error, reload } = useAsync(
    () => api.getQuiz(quizId),
    [quizId]
  );

  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  if (loading) return <Loading label="Loading quiz…" />;
  if (error) return <ErrorAlert onRetry={reload}>{error}</ErrorAlert>;
  if (!quiz) return null;

  const backTo = "/student/classes/" + quiz.class;
  const total = (quiz.questions || []).reduce((s, q) => s + (Number(q.points) || 1), 0);
  const answered = Object.keys(answers).length;

  async function submit() {
    const payload = quiz.questions.map((_, i) => (answers[i] === undefined ? null : answers[i]));
    const missing = payload.filter((a) => a === null).length;
    if (missing > 0) {
      setErrors(`${missing} question${missing === 1 ? "" : "s"} still unanswered. Select an answer for each one.`);
      return;
    }

    setBusy(true);
    setErrors("");
    try {
      const res = await api.submitQuizAttempt(quizId, payload);
      setResult(res);
      toast.success(res.message || "Quiz submitted");
    } catch (err) {
      setErrors(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <>
        <PageHeader title={quiz.title} subtitle="Result" />
        <Card className="p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>

          {result.showResult ? (
            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              {result.attempt.score} / {total}
            </p>
          ) : (
            <p className="mt-4 text-lg font-semibold text-slate-800">Your answers were submitted</p>
          )}

          <p className="mt-2 text-sm text-slate-500">
            {result.showResult
              ? result.attempt.score === total
                ? "Perfect score — well done!"
                : `Attempt ${result.attempt.attempt} recorded on ${formatDate(result.attempt.takenAt, true)}.`
              : "Your teacher will release the score later."}
          </p>

          <div className="mt-6 flex justify-center gap-2">
            <Button variant="secondary" onClick={() => navigate(backTo)}>
              Back to class
            </Button>
            <Link to="/student/grades">
              <Button variant="secondary">View grades</Button>
            </Link>
          </div>
        </Card>
      </>
    );
  }

  if (quiz.canTake === false) {
    return (
      <>
        <PageHeader title={quiz.title} subtitle="Quiz" />
        <Card className="p-8 text-center">
          <HelpCircle className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-base font-semibold text-slate-800">You have already taken this quiz</p>
          <p className="mt-1 text-sm text-slate-500">Retakes are turned off for this quiz.</p>
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="secondary" onClick={() => navigate(backTo)}>Back to class</Button>
            <Link to="/student/grades"><Button variant="secondary">View grades</Button></Link>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <Link
        to={backTo}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to class
      </Link>

      <PageHeader
        title={quiz.title}
        subtitle={
          quiz.instructions ||
          "Choose the best answer for each question. Your score is calculated automatically."
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone="violet">{total} points</Badge>
        <Badge tone="slate">{quiz.questions.length} questions</Badge>
        <Badge tone="blue">{answered} / {quiz.questions.length} answered</Badge>
        {quiz.dueDate && (
          <Badge tone={new Date(quiz.dueDate) < new Date() ? "rose" : "amber"}>
            <Clock className="mr-1 inline h-3 w-3" />
            Due {formatDate(quiz.dueDate, true)}
          </Badge>
        )}
      </div>

      <Card className="p-5">
        <FormError>{errors}</FormError>

        <ol className="space-y-6">
          {quiz.questions.map((q, qi) => (
            <li key={q._id || qi} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">
                  <span className="mr-2 text-slate-400">{qi + 1}.</span>
                  {q.question}
                </p>
                <span className="shrink-0 text-xs text-slate-400">{q.points || 1} pt</span>
              </div>

              <div className="space-y-2">
                {q.options.map((option, oi) => (
                  <label
                    key={oi}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                      answers[qi] === oi
                        ? "border-sage bg-mist text-sage-dark"
                        : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${qi}`}
                      checked={answers[qi] === oi}
                      onChange={() => setAnswers({ ...answers, [qi]: oi })}
                      className="h-4 w-4 border-slate-300 text-sage focus:ring-sage"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-400">
            {quiz.allowRetake
              ? "Retakes are allowed on this quiz."
              : "You can only submit this quiz once."}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(backTo)}>Cancel</Button>
            <Button onClick={submit} loading={busy}>
              Submit quiz
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}
