import type { PropsWithChildren } from "react";
import { Link, NavLink } from "react-router-dom";
import { Activity, Gauge, Home, Settings, UploadCloud } from "lucide-react";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Verify", href: "/verify", icon: UploadCloud },
  { label: "Results", href: "/results", icon: Activity },
  { label: "Settings", href: "/settings", icon: Settings }
];

export const AppShell = ({ children }: PropsWithChildren) => {
  return (
    <div className="min-h-screen bg-ink-50 text-ink-900">
      <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-ink-900 text-white">
              <Gauge className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-base font-semibold leading-tight">Bulk Email Verifier</span>
              <span className="block text-sm text-ink-500">Validation operations console</span>
            </span>
          </Link>
          <nav className="flex gap-1 overflow-x-auto" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    [
                      "flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                      isActive ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-100"
                    ].join(" ")
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
};
