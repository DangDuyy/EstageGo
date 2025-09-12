import React from "react";
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

// Item derives active state directly from current pathname (no persistence)
const Item = ({ to, children, end, currentPath }) => (
  <NavigationMenuItem>
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => {
        // Treat '/home' as home too
        if (to === '/' && (currentPath === '/' || currentPath === '/home')) {
          isActive = true;
        }
        return `${linkBase} ${isActive ? activeClass : inactiveClass}`;
      }}
    >
      {children}
    </NavLink>
  </NavigationMenuItem>
);

export const NavMenu = (props) => {
  const { pathname } = useLocation();

  return (
    <NavigationMenu {...props}>
      <NavigationMenuList className="gap-5 lg:gap-2 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start font-bold lg:text-xl texl-4xl">
        {menuItems.map((it) => (
          <Item key={it.to} to={it.to} end={it.end} currentPath={pathname}>{it.label}</Item>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
};
