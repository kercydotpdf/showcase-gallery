import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <Compass className="h-7 w-7 text-slate-400" />
      </div>
      <h1 className="mt-5 text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        The page you are looking for does not exist or you do not have access to it.
      </p>
      <Link
        to="/login"
        className="mt-6 rounded-lg bg-sage px-5 py-2.5 text-sm font-medium text-white hover:bg-sage-dark"
      >
        Back to sign in
      </Link>
    </div>
  );
}
