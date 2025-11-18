import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export const Logo = ({ className, textClassName, showText = true, ...props }) => (
  <Link to="/home" className="flex items-end gap-1 hover:opacity-80 transition">
    <img 
      src='/images/logo/logo.png' 
      alt='EstageGo Logo' 
      className={cn("w-6 h-6", className)}
    />
    {showText && (
      <p className={cn("font-bold text-xl whitespace-nowrap p-0 m-0 inline-block leading-none", textClassName || "text-foreground")}>
        EstageGo
      </p>
    )}
  </Link>
);
