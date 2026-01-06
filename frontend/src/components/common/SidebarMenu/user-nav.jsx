import { LayoutGrid, LogOut, User, ShieldCheck, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, logoutUserAPI } from "@/redux/user/userSlice";
import { getMembershipInfoAPI } from "@/apis";

export function UserNav() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const currentUser = useSelector(selectCurrentUser)
  const [membershipType, setMembershipType] = useState('basic')

  useEffect(() => {
    const fetchMembershipInfo = async () => {
      try {
        const response = await getMembershipInfoAPI();
        if (response.success && response.data) {
          setMembershipType(response.data.membershipType || 'basic');
        }
      } catch (error) {
        console.error('Failed to fetch membership info:', error);
      }
    };
    
    if (currentUser) {
      fetchMembershipInfo();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUserAPI()).unwrap()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (!currentUser) {
    return null;
  }

  return (
    <DropdownMenu>
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="relative h-8 w-8 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.avatar} alt="Avatar" />
                  <AvatarFallback className="bg-transparent">User</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Profile</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">{currentUser.fullName}</p>
              {membershipType === 'advanced' && (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                  Advanced
                </span>
              )}
              {membershipType === 'boosted' && (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                  Boosted
                </span>
              )}
            </div>
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
          <DropdownMenuItem className="hover:cursor-pointer" asChild>
            <Link to="/dashboard/plans" className="flex items-center">
              <Crown className="w-4 h-4 mr-3 text-muted-foreground" />
              Plans
            </Link>
          </DropdownMenuItem>
          {currentUser?.role === 'admin' && (
            <DropdownMenuItem className="hover:cursor-pointer" asChild>
              <Link to="/admin/dashboard" className="flex items-center">
                <ShieldCheck className="w-4 h-4 mr-3 text-muted-foreground" />
                Admin
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="hover:cursor-pointer" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-3 text-muted-foreground" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}