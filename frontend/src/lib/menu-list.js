import { Tag, Users, Settings, Bookmark, SquarePen, LayoutGrid, MessageCircleMore, HeartPlus, House, ShieldCheck, UserCheck, Home } from "lucide-react";

export function getMenuList(pathname, isAdminPanel = false) {
  // Admin Panel Menu
  if (isAdminPanel || pathname?.startsWith('/admin')) {
    return [
      {
        groupLabel: "",
        menus: [
          {
            href: "/admin/dashboard",
            label: "Dashboard",
            icon: LayoutGrid,
            submenus: []
          }
        ]
      },
      {
        groupLabel: "Management",
        menus: [
          {
            href: "/admin/properties",
            label: "Properties",
            icon: Home,
            submenus: []
          },
          {
            href: "/admin/agent-requests",
            label: "Agent Requests",
            icon: UserCheck,
            submenus: []
          },
          {
            href: "/admin/users",
            label: "Users",
            icon: Users,
            submenus: []
          }
        ]
      }
    ];
  }

  // User Dashboard Menu
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
          submenus: [
            { href: "/dashboard/posts", label: "All post" },
            { href: "/dashboard/posts/new", label: "New post" }
          ]
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
