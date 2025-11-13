import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export const Logo = ({ className, textClassName, showText = true, ...props }) => (
  <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition">
    <img 
      src='/images/logo/logo.png' 
      alt='EstageGo Logo' 
      className={cn("w-10 h-10", className)}
    />
    {showText && (
      <h1 className={cn("font-bold text-xl whitespace-nowrap", textClassName || "text-foreground")}>
        EstageGo
      </h1>
    )}
  </Link>
);
