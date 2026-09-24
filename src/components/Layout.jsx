import { NavLink, Outlet, useLocation } from "react-router-dom";
import { CalendarDays, Sun, ClipboardList } from "lucide-react";
import { Toaster } from "sonner";
import { useStored } from "@/app/storage";
import { currentMonth } from "@/app/dates";
import { GROUP_TITLE } from "@/app/publishers";
import "@/app.css";

const TABS = [
  {
    to: "/semaine",
    label: "Semaine",
    icon: CalendarDays,
    id: "nav-tab-semaine",
  },
  { to: "/weekend", label: "Weekend", icon: Sun, id: "nav-tab-weekend" },
  {
    to: "/rapports",
    label: "Rapports",
    icon: ClipboardList,
    id: "nav-tab-rapports",
  },
];

export default function Layout() {
  const [mois, setMois] = useStored("pp_mois", currentMonth());
  const section = useLocation().pathname.split("/")[1] || "semaine";

  return (
    <div className={`pp-app theme-${section}`}>
      <header className="topbar">
        <div className="topbar__inner">
          <div className="brand" data-testid="brand-title">
            <span className="brand__mark">A</span>
            <span className="brand__text">{GROUP_TITLE}</span>
          </div>
          <nav className="tabs" data-testid="main-nav">
            {TABS.map(({ to, label, icon: Icon, id }) => (
              <NavLink key={to} to={to} className="tabs__link" data-testid={id}>
                <Icon size={16} /> {label}
              </NavLink>
            ))}
          </nav>
          <label className="month-picker">
            <span>Mois</span>
            <input
              type="month"
              value={mois}
              onChange={(e) => e.target.value && setMois(e.target.value)}
              data-testid="input-month-selector"
            />
          </label>
        </div>
      </header>
      <main className="page">
        <Outlet context={{ mois }} />
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}
