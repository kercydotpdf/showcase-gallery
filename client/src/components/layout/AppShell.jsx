import { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Library,
  CalendarDays,
  Megaphone,
  Award,
  LogOut,
  Menu,
  X,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV = {
  admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/students", label: "Students", icon: GraduationCap },
    { to: "/admin/teachers", label: "Teachers", icon: Users },
    { to: "/admin/subjects", label: "Subjects", icon: BookOpen },
    { to: "/admin/classes", label: "Classes", icon: CalendarDays },
    { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  ],
  teacher: [
    { to: "/teacher", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/teacher/classes", label: "My Classes", icon: CalendarDays },
    { to: "/teacher/announcements", label: "Announcements", icon: Megaphone },
  ],
  student: [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/student/classes", label: "My Subjects", icon: BookOpen },
    { to: "/student/assignments", label: "Assignments", icon: ClipboardList },
    { to: "/student/grades", label: "Grades", icon: Award },
    { to: "/student/announcements", label: "Announcements", icon: Megaphone },
  ],
};

const ROLE_LABEL = { admin: "Administrator", teacher: "Teacher", student: "Student" };
const ROLE_TONE = {
  admin: { chip: "bg-lavender text-sage-dark", avatar: "bg-lavender text-sage-dark" },
  teacher: { chip: "bg-mist text-sage-dark", avatar: "bg-sage text-white" },
  student: { chip: "bg-peach text-sage-dark", avatar: "bg-peach text-sage-dark" },
};

function SidebarContent({ role, onNavigate }) {
  const items = NAV[role] || [];
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ivory text-sage shadow-sm">
          <Library className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-bold text-ivory">EduWow</p>
          <p className="text-[11px] font-medium text-mist">Learning Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-ivory text-sage-dark shadow-sm"
                  : "text-mist hover:bg-white/10 hover:text-ivory"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                    isActive ? "bg-sage text-ivory" : "bg-white/10 text-mist group-hover:text-ivory"
                  }`}
                >
                  <item.icon className="h-[16px] w-[16px]" />
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/15 px-5 py-4">
        <p className="text-[11px] uppercase tracking-wider text-mist/70">Academic Year</p>
        <p className="mt-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-sm font-medium text-ivory">
          School Year {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  const { user, initializing, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMobileOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  // Login page and other signed-out screens render without the app chrome.
  if (!user) {
    if (initializing) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ivory">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-sage border-t-transparent" />
        </div>
      );
    }
    return <div className="min-h-screen bg-ivory">{children}</div>;
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-ivory">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-sage lg:block">
        <SidebarContent role={user.role} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-sage-dark/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-sage shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-mist hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent role={user.role} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-mist bg-ivory/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-sage hover:bg-mist lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden lg:block">
              <p className="text-sm font-medium text-sage-light">
                {ROLE_LABEL[user.role]} portal
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-xl bg-white/60 py-1 pl-1 pr-3 ring-1 ring-mist">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${ROLE_TONE[user.role].avatar}`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold leading-tight text-sage-dark">{user.name}</p>
                  <p className="text-xs leading-tight text-sage-light">{ROLE_LABEL[user.role]}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-mist px-3 py-2 text-sm font-medium text-sage transition hover:bg-mist"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>

        <footer className="mx-auto w-full max-w-7xl px-4 pb-8 text-center text-xs text-sage-light sm:px-6 lg:px-8">
          EduWow ELMS · Academic project
        </footer>
      </div>
    </div>
  );
}

