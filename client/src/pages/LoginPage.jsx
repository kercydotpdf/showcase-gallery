import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { useAuth, HOME_FOR_ROLE } from "../context/AuthContext";
import Button from "../components/ui/Button";
import { Field, Input, FormError } from "../components/ui/Form";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const user = await login(email.trim(), password);
      const to = location.state?.from || HOME_FOR_ROLE[user.role];
      navigate(to, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[45%_55%]">
      {/* Brand hero */}
      <div className="relative hidden overflow-hidden bg-sage px-14 py-12 lg:flex lg:flex-col xl:px-16">
        {/* Subtle academic decoration */}
        <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-lavender/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-peach/25 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #F8F7F2 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />

        {/* Brand */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ivory text-sage shadow-sm">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div className="leading-tight">
            <p className="text-xl font-extrabold tracking-tight text-ivory">EduWow</p>
            <p className="text-xs font-medium text-mist">Learning Management System</p>
          </div>
        </div>

        {/* Slogan hero — vertical center */}
        <div className="relative flex flex-1 flex-col justify-center py-16">
          <h1 className="max-w-md text-5xl font-extrabold leading-[1.08] tracking-tight text-ivory xl:text-6xl">
            Hindi tinipid,
            <br />
            <span className="text-mist">pero tinamad.</span>
          </h1>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-mist">
            Courses, modules, lessons, assignments, quizzes and grades — managed by
            administrators and teachers, accessible to every enrolled student.
          </p>
          <div className="mt-8 h-1.5 w-16 rounded-full bg-lavender/60" />
        </div>


      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-ivory px-5 py-12 sm:px-10 lg:px-12">
        <div className="w-full max-w-[440px]">
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage text-ivory">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-lg font-bold text-sage">EduWow</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-sage-dark">Welcome back</h2>
          <p className="mt-2 text-base text-sage-light">
            Sign in to access your EduWow account.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            <FormError>{error}</FormError>

            <Field label="Email address" required>
              <Input
                type="email"
                autoComplete="username"
                placeholder="you@school.edu"
                className="h-12 px-4 text-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field label="Password" required>
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-12 px-4 pr-12 text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sage-light transition hover:text-sage"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </Field>

            <Button
              type="submit"
              className="mt-1 h-12 w-full text-base font-semibold"
              loading={busy}
            >
              Sign in
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-sage-light">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-sage underline underline-offset-2">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
