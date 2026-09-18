import {
  CreditCard,
  LayoutDashboard,
  Landmark,
  ListTree,
  PiggyBank,
  Repeat,
  Target,
  Wallet,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";

const links = [
  { to: "/", label: "Dashboard", end: true, icon: LayoutDashboard },
  { to: "/accounts", label: "Accounts", icon: Wallet },
  { to: "/transactions", label: "Transactions", icon: ListTree },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/recurring", label: "Recurring", icon: Repeat },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/credit", label: "Credit Health", icon: CreditCard },
  { to: "/reports", label: "Reports", icon: Landmark },
];

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-[76px] flex-shrink-0 flex-col bg-sidebar px-2 py-6 text-sidebar-foreground sm:w-64 sm:px-4">
      <div className="mb-7 flex items-center justify-center gap-3 px-0 sm:justify-start sm:px-2">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-primary to-fuchsia-500 text-xs font-extrabold text-white">
          SF
        </div>
        <div className="hidden sm:block">
          <div className="text-sm font-bold leading-tight text-white">Student Finance</div>
          <div className="text-xs text-sidebar-foreground">Coach</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-center gap-3 rounded-md px-0 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors sm:justify-start sm:px-3",
                  isActive
                    ? "bg-sidebar-accent text-white shadow-[0_4px_14px_-2px_rgba(99,102,241,0.5)]"
                    : "hover:bg-white/5 hover:text-white",
                )
              }
            >
              <Icon size={18} strokeWidth={2} />
              <span className="hidden sm:inline">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-4 hidden border-t border-sidebar-border pt-3.5 sm:block">
        <p className="text-[11px] leading-relaxed text-sidebar-foreground/70">
          Simulated credit score &amp; insights are educational only - not financial advice.
        </p>
      </div>
    </aside>
  );
}
