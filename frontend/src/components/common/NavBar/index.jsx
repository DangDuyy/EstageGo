import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { NavMenu } from "./menu";
import { NavigationSheet } from "./navigation-sheet";
import ToogleMode from "./toggle-mode";
import { Folders, User } from "lucide-react";
import { useState } from "react";
import LoginModal from "../Modal/login";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/redux/user/userSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NavBar = () => {
  const [openModal, setOpenModal] = useState(false)

  const currentUser = useSelector(selectCurrentUser)

  return (
    <div className="min-h-[95px] bg-muted">
      <nav
        className="fixed left-0 right-0 h-24 bg-background border dark:border-slate-700/70 shadow-lg w-full">
        <div className="h-full flex items-center justify-between mx-auto px-20">
          <Logo />

          {/* Desktop Menu */}
          <NavMenu className="hidden md:block" />

          <div className="flex items-center gap-6">
            <ToogleMode />
            { currentUser 
              ? <Avatar className="h-13 w-13">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>{currentUser.name}</AvatarFallback>
                </Avatar>
              : <Button 
                variant="outline" 
                className="hidden sm:inline-flex rounded-full text-lg px-7 py-3 h-14 min-w-[120px] cursor-pointer" 
                onClick={() => setOpenModal(true)}>
                <User />
                Sign In
              </Button> }
            <Button className="rounded-full text-lg px-7 py-3 h-14 min-w-[200px] cursor-pointer">
              <Folders />
              Submit Property
            </Button>
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
