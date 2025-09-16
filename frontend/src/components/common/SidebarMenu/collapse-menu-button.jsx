import { ChevronDown, Dot } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DropdownMenuArrow } from "@radix-ui/react-dropdown-menu";

export function CollapseMenuButton({
  icon: Icon,
  label,
  submenus,
  isOpen
}) {
  const location = useLocation()
  const pathname = location.pathname
  const isSubmenuActive = submenus.some((submenu) =>
    submenu.active === undefined ? pathname === submenu.href : submenu.active);
  const [isCollapsed, setIsCollapsed] = useState(isSubmenuActive);

  return isOpen ? (
    <Collapsible open={isCollapsed} onOpenChange={setIsCollapsed} className="w-full">
      <CollapsibleTrigger className="[&[data-state=open]>div>div>svg]:rotate-180 mb-1" asChild>
        <Button
          variant={isSubmenuActive ? "secondary" : "ghost"}
          className="w-full justify-start h-10 px-0">
          <div className="w-full items-center flex justify-between pl-4 pr-2">
            <div className="flex items-center">
              <span className="mr-6">
                <Icon size={18} />
              </span>
              <p
                className={cn("max-w-[150px] truncate text-lg", isOpen
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-96 opacity-0")}>
                {label}
              </p>
            </div>
            <div
              className={cn("whitespace-nowrap", isOpen
                ? "translate-x-0 opacity-100"
                : "-translate-x-96 opacity-0")}>
              <ChevronDown size={18} className="transition-transform duration-200" />
            </div>
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent
        className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        {submenus.map(({ href, label, active }, index) => (
          <Button
            key={index}
            variant={
              (active === undefined && pathname === href) || active
                ? "secondary"
                : "ghost"
            }
            className="w-full justify-start h-10 mb-1 pl-4 pr-2"
            asChild>
            <Link to={href}>
              <span className="mr-4 ml-1">
                <Dot size={18} />
              </span>
              <p
                className={cn("max-w-[170px] truncate text-lg", isOpen
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-96 opacity-0")}>
                {label}
              </p>
            </Link>
          </Button>
        ))}
      </CollapsibleContent>
    </Collapsible>
  ) : (
    <DropdownMenu>
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant={isSubmenuActive ? "secondary" : "ghost"}
                className="h-10 w-full mb-1 p-0 flex items-center justify-center gap-0"
              >
                {Icon && <Icon size={18} />}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" alignOffset={2}>
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent side="right" sideOffset={25} align="start">
    <DropdownMenuLabel className="max-w-[190px] truncate text-xl">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {submenus.map(({ href, label, active }, index) => (
          <DropdownMenuItem key={index} asChild>
            <Link
              className={`cursor-pointer ${
                ((active === undefined && pathname === href) || active) &&
                "bg-secondary"
              }`}
              to={href}>
              <p className="max-w-[180px] truncate">{label}</p>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuArrow className="fill-border" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
