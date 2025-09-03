// src/components/common/TabNav.jsx
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils"; // nếu chưa có, thay bằng template string

export default function TabNav({ base = "", tabs = [] }) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {tabs.map(t => (
        <NavLink
          key={t.to}
          to={`${base}${t.to}`}
          end
          className={({ isActive }) =>
            cn(
              "inline-flex items-center rounded-full px-4 h-10 text-sm font-medium border transition",
              "hover:bg-accent hover:text-accent-foreground",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-input"
            )
          }
        >
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}
