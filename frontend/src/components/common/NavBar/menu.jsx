import React, { useState, useRef } from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { NavLink, useLocation, Link } from "react-router-dom";

// Base styles
const linkBase = "px-6 py-3 transition";
const activeClass = "!text-blue-600 !underline underline-offset-8 decoration-2";
const inactiveClass = "text-foreground hover:text-blue-600";

// Top-level items (except AI Trend)
const menuItems = [
  { to: "/", label: "Home", end: true },
  { to: "/listing", label: "Listing" },
  { to: "/properties", label: "Properties" },
  { to: "/pages", label: "Pages" },
  { to: "/blog", label: "Blog" },
  { to: "/dashboard", label: "Dashboard" },
];

// Standard item
const Item = ({ to, children, end, currentPath }) => (
  <NavigationMenuItem>
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => {
        if (to === "/" && (currentPath === "/" || currentPath === "/home")) {
          isActive = true;
        }
        return `${linkBase} ${isActive ? activeClass : inactiveClass}`;
      }}
    >
      {children}
    </NavLink>
  </NavigationMenuItem>
);

// AI submenu entry
function AiSubItem({ to, title, desc }) {
  return (
    <li className="min-w-[240px]">
      <Link
        to={to}
        className="block rounded-lg p-3 hover:bg-accent hover:text-accent-foreground"
      >
        <div className="text-sm font-semibold">{title}</div>
        {desc && (
          <p className="mt-1 text-xs text-muted-foreground leading-snug">
            {desc}
          </p>
        )}
      </Link>
    </li>
  );
}

export const NavMenu = (props) => {
  const { pathname } = useLocation();
  const isAiActive = pathname === "/ai" || pathname.startsWith("/ai/");
  const [aiOpen, setAiOpen] = useState(false);
  const aiRef = useRef(null);

  // Open on hover; close when mouse leaves the whole item area
  const handleMouseEnter = () => setAiOpen(true);
  const handleMouseLeave = () => setAiOpen(false);

  return (
    <NavigationMenu {...props}>
      <NavigationMenuList className="gap-5 lg:gap-2 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start font-semibold md:text-lg texl-4xl">
        {menuItems.map((it) => (
          <Item key={it.to} to={it.to} end={it.end} currentPath={pathname}>
            {it.label}
          </Item>
        ))}

        {/* AI Trend as a dropdown that opens on hover OR click */}
        <NavigationMenuItem
          ref={aiRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <DropdownMenu open={aiOpen} onOpenChange={setAiOpen}>
            <DropdownMenuTrigger
              className={`${linkBase} bg-transparent hover:bg-transparent whitespace-nowrap ${
                isAiActive ? activeClass : inactiveClass
              }`}
              // Prevent navigation; this is a button-like trigger
              asChild
            >
              <button
                type="button"
                // Keyboard: open on Enter/Space when focused
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setAiOpen((v) => !v);
                  }
                }}
              >
                AI Trend
              </button>
            </DropdownMenuTrigger>

            {/* Appears directly under the trigger */}
            <DropdownMenuContent
              align="start"
              side="bottom"
              className="p-4"
              // Keep it wide and structured
            >
              <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2 grid-cols-1">
                <ul className="space-y-2">
                  <li className="px-1 text-xs uppercase tracking-wider text-muted-foreground">
                    Search & Recommend
                  </li>
                  <AiSubItem
                    to="/ai/nl-search"
                    title="Natural Language Search"
                    desc='Type "3BR near schools, under 3B"'
                  />
                  <AiSubItem
                    to="/ai/semantic-recommend"
                    title="Behavioral Recommendations"
                    desc="Personalized results from your browsing"
                  />
                  <AiSubItem
                    to="/ai/fuzzy-search"
                    title="Fuzzy & Semantic Search"
                    desc="Handle typos and near-meaning terms"
                  />
                </ul>

                <ul className="space-y-2">
                  <li className="px-1 text-xs uppercase tracking-wider text-muted-foreground">
                    Pricing & Analytics
                  </li>
                  <AiSubItem
                    to="/ai/price-estimator"
                    title="Automated Valuation (AVM)"
                    desc="Estimate price from area, size, amenities"
                  />
                  <AiSubItem
                    to="/ai/price-forecast"
                    title="Price Trend Forecast"
                    desc="Short-term predictions by location"
                  />
                  <AiSubItem
                    to="/ai/fraud-detection"
                    title="Fraud Detection"
                    desc="Risk scoring for listings & sellers"
                  />
                </ul>

                <ul className="space-y-2">
                  <li className="px-1 text-xs uppercase tracking-wider text-muted-foreground">
                    Media & Assistant
                  </li>
                  <AiSubItem
                    to="/ai/image-tagging"
                    title="Image Tagging"
                    desc="Auto-detect kitchen, living room, balcony…"
                  />
                  <AiSubItem
                    to="/ai/auto-description"
                    title="AI Listing Description"
                    desc="Generate compelling copy from raw data"
                  />
                  <AiSubItem
                    to="/ai/virtual-tour"
                    title="Virtual Tour 360°/3D"
                    desc="View properties remotely from images/video"
                  />
                  <AiSubItem
                    to="/ai/assistant"
                    title="Chatbot / Assistant"
                    desc="24/7 Q&A, mortgage calc, viewing schedule"
                  />
                </ul>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};
