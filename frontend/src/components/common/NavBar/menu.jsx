import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { NavLink } from "react-router-dom";

const linkBase = "px-6 py-3 text-xl transition";
const activeClass = "text-blue-600 underline underline-offset-8 decoration-2";
const inactiveClass = "text-foreground hover:text-blue-600";

const Item = ({ to, children, end }) => (
  <NavigationMenuItem>
    <NavigationMenuLink asChild>
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          `${linkBase} ${isActive ? activeClass : inactiveClass}`
        }
      >
        {children}
      </NavLink>
    </NavigationMenuLink>
  </NavigationMenuItem>
);

export const NavMenu = (props) => (
  <NavigationMenu {...props}>
    <NavigationMenuList className="gap-10 space-x-0 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start font-bold text-xl">
      <Item to="/" end>Home</Item>
      <Item to="/listing">Listing</Item>
      <Item to="/properties">Properties</Item>
      <Item to="/pages">Pages</Item>
      <Item to="/blog">Blog</Item>
      <Item to="/dashboard">Dashboard</Item>
    </NavigationMenuList>
  </NavigationMenu>
);
