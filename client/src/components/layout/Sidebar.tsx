import {
  CreditCard,
  HandCoins,
  LayoutDashboard,
  Landmark,
  ListTree,
  Menu,
  PiggyBank,
  Repeat,
  Settings,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../ui/sheet";

const links: { to: string; label: string; end?: boolean; icon: LucideIcon }[] = [
  { to: "/", label: "Dashboard", end: true, icon: LayoutDashboard },
  { to: "/accounts", label: "Accounts", icon: Wallet },
  { to: "/transactions", label: "Transactions", icon: ListTree },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/recurring", label: "Recurring", icon: Repeat },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/debts", label: "Debts", icon: HandCoins },
  { to: "/credit", label: "Credit Health", icon: CreditCard },
  { to: "/reports", label: "Reports", icon: Landmark },
  { to: "/settings", label: "Settings", icon: Settings },
];

function Logo() {
  return (
    <div className="mb-7 flex items-center gap-3 px-2">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-primary to-fuchsia-500 text-xs font-extrabold text-white">
        SF
      </div>
      <div>
        <div className="text-sm font-bold leading-tight text-white">Student Finance</div>
        <div className="text-xs text-sidebar-foreground">Coach</div>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors",
                isActive
                  ? "bg-sidebar-accent text-white shadow-[0_4px_14px_-2px_rgba(99,102,241,0.5)]"
                  : "hover:bg-white/5 hover:text-white",
              )
            }
          >
            <Icon size={18} strokeWidth={2} />
            <span>{link.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function Disclaimer() {
  return (
    <div className="mt-4 border-t border-sidebar-border pt-3.5">
      <p className="text-[11px] leading-relaxed text-sidebar-foreground/70">
        Simulated credit score &amp; insights are educational only - not financial advice.
      </p>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className="rounded-md p-1.5 text-sidebar-foreground transition-colors hover:bg-white/10 hover:text-white"
            >
              <Menu size={20} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col px-4 py-6">
            <SheetTitle>Navigation</SheetTitle>
            <Logo />
            <NavLinks onNavigate={() => setOpen(false)} />
            <Disclaimer />
          </SheetContent>
        </Sheet>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-primary to-fuchsia-500 text-[11px] font-extrabold text-white">
          SF
        </div>
        <span className="text-sm font-bold text-white">Student Finance Coach</span>
      </header>

      <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col bg-sidebar px-4 py-6 text-sidebar-foreground md:flex">
        <Logo />
        <NavLinks />
        <Disclaimer />
      </aside>
    </>
  );
}
