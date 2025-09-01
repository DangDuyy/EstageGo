import React, { useEffect, useState } from "react";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu";
import { NavLink, useLocation } from "react-router-dom";

const linkBase = "px-6 py-3 transition";
// use !important variants to override other nav/menu color rules when needed
const activeClass = "!text-blue-600 !underline underline-offset-8 decoration-2";
const inactiveClass = "text-foreground hover:text-blue-600";

// top-level items so useEffect doesn't need to include them as deps
const menuItems = [
  { to: "/", label: "Home", end: true },
  { to: "/listing", label: "Listing" },
  { to: "/properties", label: "Properties" },
  { to: "/pages", label: "Pages" },
  { to: "/blog", label: "Blog" },
  { to: "/dashboard", label: "Dashboard" },
];

// Item receives selected/setSelected so we can persist the active tab
const Item = ({ to, children, end, selected, setSelected }) => (
  <NavigationMenuItem>
    <NavLink
      to={to}
      end={end}
      onClick={() => {
        try {
          localStorage.setItem("nav-active", to);
        } catch {
          /* ignore storage errors (e.g., private mode) */
        }
        setSelected?.(to);
      }}
      className={() => `${linkBase} ${selected === to ? activeClass : inactiveClass}`}
    >
      {children}
    </NavLink>
  </NavigationMenuItem>
);

export const NavMenu = (props) => {
  const location = useLocation();
  const [selected, setSelected] = useState(() => {
    try {
      return localStorage.getItem("nav-active") || "";
    } catch {
      return "";
    }
  });

  // When the route changes, prefer router-derived active tab. If no route matches
  // any top-level item, fall back to previously stored selection.
  useEffect(() => {
  const match = menuItems.find((it) => {
      if (it.end) return location.pathname === it.to;
      if (it.to === "/") return location.pathname === "/";
      return location.pathname.startsWith(it.to);
    });

    if (match) {
      setSelected(match.to);
      try {
        localStorage.setItem("nav-active", match.to);
      } catch {
        /* ignore storage errors */
      }
    }
    // else keep previously selected (from storage)
  }, [location.pathname]);

  return (
    <NavigationMenu {...props}>
      <NavigationMenuList className="gap-10 space-x-0 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start font-bold text-2xl">
  {menuItems.map((it) => (
          <Item
            key={it.to}
            to={it.to}
            end={it.end}
            selected={selected}
            setSelected={setSelected}
          >
            {it.label}
          </Item>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
};
