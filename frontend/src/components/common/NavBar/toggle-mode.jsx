"use client";

import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "@/lib/utils";
import { MoonIcon, SunMediumIcon } from "lucide-react";

// Replace the `Switch` component in `@components/ui/switch` with below component and use it here to support this customization.
const Switch = React.forwardRef(({ className, icon, thumbClassName, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}>
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none flex h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 items-center justify-center",
        thumbClassName
      )}>
      {icon ? icon : null}
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;


const ToogleMode = () => {
  // Check localStorage and system preference on mount
  const getInitialMode = () => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    // Fallback: system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [isDarkMode, setIsDarkMode] = React.useState(getInitialMode);

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <Switch
      icon={
        isDarkMode ? (
          <MoonIcon className="h-4 w-4" />
        ) : (
          <SunMediumIcon className="h-4 w-4" />
        )
      }
      checked={isDarkMode}
      onCheckedChange={setIsDarkMode}
      className="h-8 w-20"
      thumbClassName="h-8 w-15 data-[state=checked]:translate-x-5" />
  );
};

export default ToogleMode;
