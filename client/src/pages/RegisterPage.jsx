import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Users, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Button from "../components/ui/Button";
import { Field, Input, FormError } from "../components/ui/Form";
import { useToast } from "../components/ui/Toast";
import * as api from "../api";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLES = [
  { key: "student", label: "Student", icon: GraduationCap },
  { key: "teacher", label: "Teacher", icon: Users },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Enter your full name.";
    else if (form.name.trim().length < 2) next.name = "Full name looks too short.";
    if (!form.email.trim()) next.email = "Enter your email address.";
    else if (!EMAIL_RX.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (!form.password) next.password = "Choose a password.";
    else if (form.password.length < 6) next.password = "Use at least 6 characters.";
    if (!form.confirmPassword) next.confirmPassword = "Confirm your password.";
    else if (form.confirmPassword !== form.password) next.confirmPassword = "Passwords do not match.";
    return next;
  }

  async function submit(e) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    setFormError("");
    if (Object.values(next).some(Boolean)) return;

    setBusy(true);
    try {
      const res = await api.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
      });
      setDone(true);
      toast.success(res.message || "Account created");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[45%_55%]">
      {/* Brand hero */}
      <div className="relative hidden overflow-hidden bg-sage px-14 py-12 lg:flex lg:flex-col xl:px-16">
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

        <Link to="/login" className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ivory text-sage shadow-sm">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div className="leading-tight">
            <p className="text-xl font-extrabold tracking-tight text-ivory">EduWow</p>
            <p className="text-xs font-medium text-mist">Learning Management System</p>
          </div>
        </Link>

        <div className="relative flex flex-1 flex-col justify-center py-16">
          <h1 className="max-w-md text-5xl font-extrabold leading-[1.08] tracking-tight text-ivory xl:text-6xl">
            Hindi tinipid,
            <br />
            <span className="text-mist">pero tinamad.</span>
          </h1>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-mist">
            Sign up in under a minute as a student or a teacher. An administrator can then
            enrol you in classes or assign classes to you.
          </p>
          <div className="mt-8 h-1.5 w-16 rounded-full bg-lavender/60" />
        </div>


      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-ivory px-5 py-12 sm:px-10 lg:px-12">
        <div className="w-full max-w-[440px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Link to="/login" className="flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage text-ivory">
                <GraduationCap className="h-6 w-6" />
              </div>
              <span className="text-lg font-bold text-sage">EduWow</span>
            </Link>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-sage-dark">Create your account</h2>
          <p className="mt-2 text-base text-sage-light">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-sage underline underline-offset-2">
              Sign in
            </Link>
          </p>

          {done ? (
            <div className="mt-8 rounded-xl border border-mist bg-mist/60 px-4 py-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage text-ivory">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-sage-dark">Account created</p>
              <p className="mt-1 text-sm text-sage-light">Taking you to the sign-in page…</p>
              <div className="mt-4">
                <Button size="sm" onClick={() => navigate("/login", { replace: true })}>
                  Go to sign in
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
              <FormError>{formError}</FormError>

              <Field label="Full name" required error={errors.name}>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Juan Dela Cruz"
                  autoComplete="name"
                  className="h-12 px-4 text-base"
                />
              </Field>

              <Field label="Email address" required error={errors.email}>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@school.edu"
                  autoComplete="email"
                  className="h-12 px-4 text-base"
                />
              </Field>

              <Field label="Password" required error={errors.password} hint="At least 6 characters">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="h-12 px-4 pr-12 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sage-light transition hover:text-sage"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4.5 w-4.5" />
                    ) : (
                      <Eye className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              </Field>

              <Field label="Confirm password" required error={errors.confirmPassword}>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-12 px-4 text-base"
                />
              </Field>

              <Field label="Account type" required>
                <div className="grid grid-cols-2 gap-2.5">
                  {ROLES.map((r) => {
                    const active = form.role === r.key;
                    return (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => set("role", r.key)}
                        className={`flex items-center gap-2.5 rounded-xl border px-4 py-3.5 text-sm font-semibold transition ${
                          active
                            ? "border-sage bg-mist text-sage-dark shadow-sm"
                            : "border-mist bg-white text-sage hover:border-sage-light"
                        }`}
                        aria-pressed={active}
                      >
                        <r.icon
                          className={`h-5 w-5 ${active ? "text-sage" : "text-sage-light"}`}
                        />
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Button
                type="submit"
                className="mt-1 h-12 w-full text-base font-semibold"
                loading={busy}
              >
                Create account
              </Button>

              <p className="text-center text-sm text-sage-light">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-sage underline underline-offset-2">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
