import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { NavMenu } from "./menu";
import { NavigationSheet } from "./navigation-sheet";
import ToogleMode from "./toggle-mode";
import { Bell, Folders, Heart, LayoutGrid, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import LoginModal from "../Modal/login";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/redux/user/userSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";


const NavBar = ({ hideLogo = false }) => {
  // Lấy trạng thái sidebar nếu cần co giãn
  const sidebar = useStore(useSidebar, (x) => x);
  const sidebarOpen = hideLogo && sidebar ? sidebar.getOpenState() : false;
  const sidebarSettings = hideLogo && sidebar ? sidebar.settings : { disabled: true };
  const [openModal, setOpenModal] = useState(false)

  const currentUser = useSelector(selectCurrentUser)

  return (
    <div className="min-h-[95px] bg-muted">
      <nav
        className={cn(
          "fixed left-0 right-0 h-24 bg-background border dark:border-slate-700/70 shadow-lg w-full transition-[padding-left] ease-in-out duration-300 z-[90]", // giảm z-index để sidebar nổi trên
          hideLogo && !sidebarSettings.disabled && (sidebarOpen ? "lg:pl-[400px]" : "lg:pl-[200px]")
        )}
      >
        <div className="h-full flex items-center justify-between lg:px-10">
          {!hideLogo && <Logo />}

          {/* Desktop Menu */}
          <NavMenu className="hidden md:block lg:max-w-lg" />

          <div className="flex items-center gap-8 shrink-0 lg:gap-4">
            <ToogleMode/>
            <Bell className="lg:h-6 lg:w-6 hidden md:block"/>
            { currentUser 
              ? 
              <>
                <Heart size={30} className="lg:h-6 lg:w-6"/>
                <DropdownMenu>
                    <TooltipProvider disableHoverableContent>
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="relative h-8 w-8 rounded-full">
                              <Avatar className="h-13 w-13 lg:h-8 lg:w-8">
                                <AvatarImage src={currentUser.avatar} alt="Avatar" />
                                <AvatarFallback className="bg-transparent">{currentUser.fullName}</AvatarFallback>
                              </Avatar>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">{currentUser.fullName}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{currentUser.fullName}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {currentUser.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem className="hover:cursor-pointer" asChild>
                          <Link to="/dashboard" className="flex items-center">
                            <LayoutGrid className="w-4 h-4 mr-3 text-muted-foreground" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:cursor-pointer" asChild>
                          <Link to="/dashboard/account" className="flex items-center">
                            <User className="w-4 h-4 mr-3 text-muted-foreground" />
                            Account
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="hover:cursor-pointer" onClick={() => {}}>
                        <LogOut className="w-4 h-4 mr-3 text-muted-foreground" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </>
              : <Button 
                variant="outline" 
                className="hidden sm:inline-flex rounded-full text-lg px-7 py-3 h-14 min-w-[120px] cursor-pointer" 
                onClick={() => setOpenModal(true)}>
                <User />
                Sign In
              </Button> }
              {!hideLogo && (
                <Button className="rounded-full text-lg px-7 py-3 h-14 min-w-[200px] cursor-pointer" onClick={() => {}}
                >
                  <Folders />
                  Submit Property
              </Button>)}
            
            {/* Mobile Menu */}
            <div className="md:hidden">
              <NavigationSheet />
            </div>
          </div>
        </div>
      </nav>

      <LoginModal open={openModal} onOpenChange={setOpenModal} />

    </div>
  );
};

export default NavBar;
