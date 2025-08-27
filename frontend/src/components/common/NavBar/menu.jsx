import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";


export const NavMenu = (props) => (
  <NavigationMenu {...props}>
    <NavigationMenuList
      className="gap-10 space-x-0 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start font-bold text-xl">
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <a href="/" className="px-6 py-3 text-xl">Home</a>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <a href="#" className="px-6 py-3 text-xl">Blog</a>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <a href="#" className="px-6 py-3 text-xl">About</a>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <a href="#" className="px-6 py-3 text-xl">Contact Us</a>
        </NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
);
