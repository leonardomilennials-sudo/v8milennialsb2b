import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Calendar,
  TrendingUp,
  Target,
  Trophy,
  Gift,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Kanban,
  UserCheck,
} from "lucide-react";
import logoDark from "@/assets/logo-light.png";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Confirmação", icon: Calendar, path: "/pipe-confirmacao", badge: 12 },
  { label: "Propostas", icon: Kanban, path: "/pipe-propostas", badge: 5 },
  { label: "WhatsApp SDR", icon: MessageSquare, path: "/pipe-whatsapp" },
  { label: "Leads", icon: Users, path: "/leads" },
  { label: "Ranking", icon: Trophy, path: "/ranking" },
  { label: "Metas", icon: Target, path: "/metas" },
  { label: "Premiações", icon: Gift, path: "/premiacoes" },
  { label: "Comissões", icon: DollarSign, path: "/comissoes" },
];

const bottomNavItems: NavItem[] = [
  { label: "Equipe", icon: UserCheck, path: "/equipe" },
  { label: "Configurações", icon: Settings, path: "/configuracoes" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-screen bg-sidebar flex flex-col border-r border-sidebar-border sticky top-0"
    >
      {/* Logo */}
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        <motion.div
          animate={{ opacity: collapsed ? 0 : 1 }}
          className="overflow-hidden"
        >
          <img src={logoDark} alt="Millennials B2B" className="h-8" />
        </motion.div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-sidebar-foreground" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={`sidebar-item ${
              isActive(item.path) ? "sidebar-item-active" : ""
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <motion.span
              animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
              className="overflow-hidden whitespace-nowrap flex-1"
            >
              {item.label}
            </motion.span>
            {item.badge && !collapsed && (
              <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={`sidebar-item ${
              isActive(item.path) ? "sidebar-item-active" : ""
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <motion.span
              animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
              className="overflow-hidden whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          </NavLink>
        ))}
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="sidebar-item cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary-foreground">JS</span>
          </div>
          <motion.div
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
            className="overflow-hidden"
          >
            <p className="text-sm font-medium text-sidebar-foreground">João Silva</p>
            <p className="text-xs text-sidebar-foreground/60">Closer</p>
          </motion.div>
        </div>
      </div>
    </motion.aside>
  );
}
