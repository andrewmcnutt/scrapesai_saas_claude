import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  Palette,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Generate", href: "/generate", icon: PlusCircle },
  { label: "History", href: "/history", icon: Clock },
  { label: "Brand Settings", href: "/brand", icon: Palette },
  { label: "Billing", href: "/billing", icon: CreditCard },
];
