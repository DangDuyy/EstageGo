import React, { useMemo, useRef, useState } from "react";
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

/* ========== Styles ========== */
const linkBase = "px-6 py-3 transition";
const activeClass = "!text-blue-600 !underline underline-offset-8 decoration-2";
const inactiveClass = "text-foreground hover:text-blue-600";

/* ========== Menu Model ========== */
const MENU = [
  { label: "Home", to: "/", end: true },

  {
    label: "Listing",
    to: "/listing",
    children: [
      { label: "Property Map", to: "/listing/map" },
      { label: "Property Grid", to: "/listing/grid" },
    ],
  },

  {
    label: "Properties",
    to: "/listing/grid",
    children: [
      { label: "Apartments", to: "/listing/grid?types=apartment" },
      { label: "Houses", to: "/listing/grid?types=house" },
      { label: "Condos", to: "/listing/grid?types=condo" },
      { label: "Land", to: "/listing/grid?types=land" },
      { label: "Commercial", to: "/listing/grid?types=commercial" },
      { label: "Offices", to: "/listing/grid?types=office" },
      { label: "Villas", to: "/listing/grid?types=villa" },
      { label: "Townhouses", to: "/listing/grid?types=townhouse" },
      { label: "Other", to: "/listing/grid?types=other" },
    ],
  },
  { label: "Agents", to: "/agents" },
  { label: "Pages", to: "/pages" },
  { label: "Blog", to: "/blog" },
  { label: "Dashboard", to: "/dashboard" },

  {
    label: "AI Trend",
    to: "/ai",
    type: "mega",
    columns: [
      {
        heading: "Search & Recommend",
        items: [
          { label: "Natural Language Search", to: "/ai/nl-search", desc: 'Type "3BR near schools, under 3B"' },
          { label: "Behavioral Recommendations", to: "/ai/semantic-recommend", desc: "Personalized results from your browsing" },
          { label: "Fuzzy & Semantic Search", to: "/ai/fuzzy-search", desc: "Handle typos and near-meaning terms" },
        ],
      },
      {
        heading: "Media & Assistant",
        items: [
          { label: "Image Tagging", to: "/ai/image-tagging", desc: "Auto-detect kitchen, living room, balcony…" },
          { label: "AI Listing Description", to: "/ai/auto-description", desc: "Generate compelling copy from raw data" },
          { label: "Virtual Tour 360°/3D", to: "/ai/virtual-tour", desc: "View properties remotely from images/video" },
          { label: "Chatbot / Assistant", to: "/ai/chatbot", desc: "24/7 Q&A, mortgage calc, viewing schedule" },
        ],
      },
    ],
  },
];

/* ========== Helpers ========== */
function isParentActive(item, pathname, search = "") {
  if (!item) return false;
  // Home: "/" hoặc "/home"
  if (item.to === "/") return pathname === "/" || pathname === "/home";
  
  // Special case for Properties menu - chỉ active khi có query param types
  if (item.label === "Properties" && item.children?.length > 0) {
    // Check if any child with query params is active
    return item.children.some((c) => {
      if (!c.to.includes('?')) return false;
      const [childPath, childQuery] = c.to.split('?');
      return pathname === childPath && search.includes(childQuery);
    });
  }
  
  // Parent active khi path bắt đầu bằng chính nó hoặc bất kỳ child nào trùng
  if (pathname === item.to || pathname.startsWith(item.to + "/")) return true;
  if (item.children?.some((c) => pathname === c.to || pathname.startsWith(c.to + "/"))) return true;
  if (item.type === "mega") {
    const all = item.columns?.flatMap((col) => col.items) || [];
    if (all.some((c) => pathname === c.to || pathname.startsWith(c.to + "/"))) return true;
  }
  return false;
}

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

/* ========== Renderers ========== */
function PlainItem({ item, pathname }) {
  return (
    <NavigationMenuItem>
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) => {
          // force active cho Home khi / hoặc /home
          if (item.to === "/" && (pathname === "/" || pathname === "/home")) {
            isActive = true;
          }
          return `${linkBase} ${isActive ? activeClass : inactiveClass}`;
        }}
      >
        {item.label}
      </NavLink>
    </NavigationMenuItem>
  );
}

function DropdownItem({ item, pathname }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  const parentActive = isParentActive(item, pathname, location.search);

  // Helper to check if a child link is active (including query params)
  const isChildActive = (childTo) => {
    if (!childTo) return false;
    const [childPath, childQuery] = childTo.split('?');
    const [currentPath, currentQuery] = (pathname + location.search).split('?');
    
    // Check if paths match and query params match
    return childPath === currentPath && childQuery === currentQuery;
  };

  return (
    <NavigationMenuItem
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          asChild
          className={`${linkBase} bg-transparent hover:bg-transparent whitespace-nowrap ${
            parentActive ? activeClass : inactiveClass
          }`}
        >
          <button
            type="button"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpen((v) => !v);
              }
            }}
          >
            {item.label}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" side="bottom" className="p-2 mt-5">
          <ul className="space-y-1 min-w-[200px]">
            {item.children?.map((c) => {
              const isActive = isChildActive(c.to);
              return (
                <li key={c.to}>
                  <Link
                    to={c.to}
                    onClick={() => setOpen(false)}
                    className={`${linkBase} block text-left w-full ${
                      isActive ? activeClass : inactiveClass
                    }`}
                  >
                    {c.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </DropdownMenuContent>
      </DropdownMenu>
    </NavigationMenuItem>
  );
}

function MegaItem({ item, pathname }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  const parentActive = isParentActive(item, pathname, location.search);

  return (
    <NavigationMenuItem
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          asChild
          className={`${linkBase} bg-transparent hover:bg-transparent whitespace-nowrap ${
            parentActive ? activeClass : inactiveClass
          }`}
        >
          <button
            type="button"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpen((v) => !v);
              }
            }}
          >
            {item.label}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" side="bottom" className="p-4 mt-5">
          <div className="grid gap-6 lg:grid-cols-2 md:grid-cols-2 grid-cols-1">
            {item.columns?.map((col, idx) => (
              <ul key={idx} className="space-y-2">
                {col.heading && (
                  <li className="px-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {col.heading}
                  </li>
                )}
                {col.items?.map((it) => (
                  <AiSubItem
                    key={it.to}
                    to={it.to}
                    title={it.label}
                    desc={it.desc}
                  />
                ))}
              </ul>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </NavigationMenuItem>
  );
}

/* ========== Main Component ========== */
export function NavMenu(props) {
  const { pathname } = useLocation();

  const items = useMemo(() => MENU, []);

  return (
    <NavigationMenu {...props}>
      <NavigationMenuList className="gap-5 lg:gap-0 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start font-semibold md:text-lg texl-4xl">
        {items.map((item) => {
          // AI Trend (mega)
          if (item.type === "mega") {
            return <MegaItem key={item.label} item={item} pathname={pathname} />;
          }
          // Dropdown thường
          if (item.children?.length) {
            return <DropdownItem key={item.label} item={item} pathname={pathname} />;
          }
          // Link thường
          return <PlainItem key={item.label} item={item} pathname={pathname} />;
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
