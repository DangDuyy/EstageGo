import { Tag, Users, Settings, Bookmark, SquarePen, LayoutGrid, MessageCircleMore, HeartPlus, House, ShieldCheck, UserCheck, Home, Zap, Crown, DollarSign, BarChart3 } from "lucide-react";

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
          },
          {
            href: "/admin/documents",
            label: "Documents",
            icon: Tag,
            submenus: []
          },
          {
            href: "/admin/transactions",
            label: "Transactions",
            icon: DollarSign,
            submenus: []
          }
        ]
      },
      {
        groupLabel: "Pricing & Config",
        menus: [
          {
            href: "/admin/membership-config",
            label: "Membership Packages",
            icon: Crown,
            submenus: []
          },
          {
            href: "/admin/listing-tier-config",
            label: "Listing Tiers",
            icon: Zap,
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
          href: "/dashboard/plans",
          label: "Membership Plans",
          icon: Crown
        },
        {
          href: "/dashboard/boost-packages",
          label: "Boost Packages",
          icon: Zap
        },
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
