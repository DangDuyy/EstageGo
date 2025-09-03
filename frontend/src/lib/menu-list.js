import { Tag, Users, Settings, Bookmark, SquarePen, LayoutGrid, MessageCircleMore, HeartPlus, House } from "lucide-react";

export function getMenuList() {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          submenus: []
        }
      ]
    },
    {
      groupLabel: "Contents",
      menus: [
        {
          href: "/dashboard/posts",
          label: "Posts",
          icon: SquarePen,
        },
        {
          href: "/dashboard/properties",
          label: "My properties",
          icon: House,
        },
        {
          href: "/dashboard/messages",
          label: "Message",
          icon: MessageCircleMore
        },
        {
          href: "/dashboard/wishlist",
          label: "My wishlist",
          icon: HeartPlus
        }
      ]
    },
    {
      groupLabel: "Settings",
      menus: [
        {
          href: "/dashboard/users",
          label: "Users",
          icon: Users
        },
        {
          href: "/dashboard/account",
          label: "Account",
          icon: Settings
        }
      ]
    }
  ];
}
