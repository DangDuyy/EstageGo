import { Button } from "@/components/ui/button";
import { useWishlist } from '@/contexts/WishlistContext';
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { logoutUserAPI, selectCurrentUser } from "@/redux/user/userSlice";
import { Bell, Folders, Heart, User } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import LoginModal from "../Modal/login";
import RegisterModal from "../Modal/register";
import { UserNav } from "../SidebarMenu/user-nav";
import { Logo } from "./logo";
import { NavMenu } from "./menu";
import { NavigationSheet } from "./navigation-sheet";
import ToogleMode from "./toggle-mode";


const NavBar = ({ hideLogo = false }) => {
  // Lấy trạng thái sidebar nếu cần co giãn
  const sidebar = useStore(useSidebar, (x) => x);
  const sidebarOpen = hideLogo && sidebar ? sidebar.getOpenState() : false;
  const sidebarSettings = hideLogo && sidebar ? sidebar.settings : { disabled: true };
  const [openModal, setOpenModal] = useState(false)
  const [openRegisterModal, setOpenRegisterModal] = useState(false)
  const { toggleWishlist, items } = useWishlist()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const currentUser = useSelector(selectCurrentUser)

  const { isOpen: wishlistOpen } = useWishlist();

  // Check if any modal is open
  const isAnyModalOpen = openModal || openRegisterModal;

  // Hàm xử lý logout
  // const handleLogout = async () => {
  //   try {
  //     await dispatch(logoutUserAPI()).unwrap()
  //     toast.success('Đăng xuất thành công!')
  //     navigate('/home')
  //   } catch {
  //     toast.error('Đăng xuất thất bại. Vui lòng thử lại!')
  //   }
  // }

  return (
    <div className="min-h-[95px] bg-muted">
      {/* Overlay mờ khi modal mở */}
      {isAnyModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[95] pointer-events-none" />
      )}

      <nav
        className={cn(
          // when wishlist is open, lower nav z-index and disable interactions so overlay can sit above
          (wishlistOpen ? "fixed left-0 right-0 h-24 bg-background border dark:border-slate-700/70 shadow-lg w-full transition-[padding-left] ease-in-out duration-300 z-0 pointer-events-none" : "fixed left-0 right-0 h-24 bg-background border dark:border-slate-700/70 shadow-lg w-full transition-[padding-left] ease-in-out duration-300 z-[90]"),
          hideLogo && !sidebarSettings.disabled && (sidebarOpen ? "lg:pl-[400px]" : "lg:pl-[200px]"),
          // Giảm opacity khi modal mở
          isAnyModalOpen && "opacity-50"
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
              <button
                type="button"
                onClick={toggleWishlist}
                title="Open wishlist"
                aria-label="Open wishlist"
                className="rounded-full p-2 hover:bg-muted transition relative"
              >
                <Heart className="h-6 w-6" />
                {items.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {items.length > 99 ? '99+' : items.length}
                  </span>
                )}
              </button>                
                <UserNav/>
              </>
              : <Button 
                variant="outline" 
                className="hidden sm:inline-flex rounded-full text-lg px-7 py-3 h-14 min-w-[120px] cursor-pointer" 
                onClick={() => setOpenModal(true)}>
                <User />
                Sign In
              </Button> }
              {!hideLogo && (
                <Button className="rounded-full text-lg px-7 py-3 h-14 min-w-[200px] cursor-pointer" onClick={() => navigate('/dashboard/posts/new')}
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

      <LoginModal 
        open={openModal} 
        onOpenChange={setOpenModal}
        onOpenRegister={() => {
          setOpenModal(false)
          setOpenRegisterModal(true)
        }}
      />
      
      <RegisterModal 
        open={openRegisterModal} 
        onOpenChange={setOpenRegisterModal}
        onOpenLogin={() => {
          setOpenRegisterModal(false)
          setOpenModal(true)
        }}
      />

    </div>
  );
};

export default NavBar;
