import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, HOME_FOR_ROLE } from "../context/AuthContext";
import { Loading } from "../components/ui/Feedback";

/** Blocks the whole app until the stored session has been restored. */
export function RequireAuth({ roles }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <Loading label="Restoring your session…" />;

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={HOME_FOR_ROLE[user.role]} replace />;
  }

  return <Outlet />;
}

/** Sends logged-in users away from the login screen. */
export function RedirectIfAuthed() {
  const { user, initializing } = useAuth();
  if (initializing) return <Loading label="Restoring your session…" />;
  if (user) return <Navigate to={HOME_FOR_ROLE[user.role]} replace />;
  return <Outlet />;
}
