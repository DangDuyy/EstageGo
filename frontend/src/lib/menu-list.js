import { Tag, Users, Settings, Bookmark, SquarePen, LayoutGrid, MessageCircleMore, HeartPlus, House } from "lucide-react";

export function getMenuList(pathname) {
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
          href: "",
          label: "Posts",
          icon: SquarePen,
          // submenus: [
          //   {
          //     href: "/posts",
          //     label: "All Posts"
          //   },
          //   {
          //     href: "/posts/new",
          //     label: "New Post"
          //   }
          // ]
        },
        {
          href: "/properties",
          label: "My properties",
          icon: House,
        },
        {
          href: "/messages",
          label: "Message",
          icon: MessageCircleMore
        },
        {
          href: "/wishlist",
          label: "My wishlist",
          icon: HeartPlus
        }
      ]
    },
    {
      groupLabel: "Settings",
      menus: [
        {
          href: "/users",
          label: "Users",
          icon: Users
        },
        {
          href: "/account",
          label: "Account",
          icon: Settings
        }
      ]
    }
  ];
}
