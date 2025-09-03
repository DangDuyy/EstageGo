// Sidebar Menu component
import { Ellipsis, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { CollapseMenuButton } from "@/components/common/SidebarMenu/collapse-menu-button";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { getMenuList } from "@/lib/menu-list";
import { cn } from "@/lib/utils";

export function Menu({ isOpen }) {
  const location = useLocation();
  const pathname = location.pathname;
  const menuList = getMenuList();

  return (
    <nav className="mt-8 h-screen w-full flex flex-col">
      <ul className="flex flex-col flex-1 space-y-1 overflow-y-auto">
        {menuList.map(({ groupLabel, menus }, index) => (
          <li className={cn("w-full", groupLabel ? "pt-5" : "")} key={index}>
            {(isOpen && groupLabel) || isOpen === undefined ? (
              <p
                className="text-xl font-medium text-muted-foreground px-4 pb-3 max-w-[248px] truncate">
                {groupLabel}
              </p>
            ) : !isOpen && isOpen !== undefined && groupLabel ? (
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger className="w-full">
                    <div className="w-full h-10 flex items-center justify-center">
                      <Ellipsis className="h-5 w-5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{groupLabel}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <p className="pb-2"></p>
            )}
            {menus.map(({ href, label, icon: Icon, active, submenus }, index) => {
              const isActive = (active === undefined && pathname.startsWith(href)) || active;
              const baseButton = (
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "h-10 mb-1",
                    isOpen ? "w-full justify-start" : "w-full justify-center px-0"
                  )}
                  asChild>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center h-full w-full",
                      isOpen ? "justify-start" : "justify-center"
                    )}>
                    <span className={cn(isOpen ? "mr-4" : "")}> <Icon size={18} /> </span>
                    <p
                      className={cn(
                        "max-w-[200px] truncate text-xl transition-all",
                        !isOpen && "hidden"
                      )}>
                      {label}
                    </p>
                  </Link>
                </Button>
              );

              if (!submenus || submenus.length === 0) {
                return (
                  <div className="w-full" key={index}>
                    <TooltipProvider disableHoverableContent>
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>{baseButton}</TooltipTrigger>
                        {!isOpen && (
                          <TooltipContent side="right">{label}</TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                );
              }

              return (
                <div className="w-full" key={index}>
                  <CollapseMenuButton
                    icon={Icon}
                    label={label}
                    active={isActive}
                    submenus={submenus}
                    isOpen={isOpen}
                  />
                </div>
              );
            })}
          </li>
        ))}
      </ul>
      <div className="mt-auto">
        <TooltipProvider disableHoverableContent>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Button
                onClick={() => {}}
                variant="outline"
                className="w-full justify-center h-12 mt-5  text-xl" >
                <span className={cn(isOpen === false ? "" : "mr-4")}>
                  <LogOut size={18} />
                </span>
                <p
                  className={cn("whitespace-nowrap", isOpen === false ? "opacity-0 hidden" : "opacity-100")}>
                  Sign out
                </p>
              </Button>
            </TooltipTrigger>
            {isOpen === false && (
              <TooltipContent side="right">Sign out</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </nav>
  );
}