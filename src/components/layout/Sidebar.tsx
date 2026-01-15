import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Gauge,
  Fuel,
  Calendar,
  Wrench,
  Trophy,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Kanban,
  UserCheck,
  LogOut,
  Zap,
  Flag,
} from "lucide-react";
import logoDark from "@/assets/logo-light.png";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { AlertsDropdown } from "@/components/notifications/AlertsDropdown";
import { SidebarPerformanceWidget } from "./SidebarPerformanceWidget";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: "Central de Comando", icon: Gauge, path: "/" },
  { label: "Revisão", icon: Wrench, path: "/follow-ups" },
  { label: "Confirmação", icon: Calendar, path: "/pipe-confirmacao" },
  { label: "Propostas", icon: Kanban, path: "/pipe-propostas" },
  { label: "Qualificação", icon: MessageSquare, path: "/pipe-whatsapp" },
  { label: "Combustível", icon: Fuel, path: "/leads" },
  { label: "Pódio", icon: Trophy, path: "/performance" },
  { label: "Comissões", icon: DollarSign, path: "/comissoes" },
];

const adminNavItems: NavItem[] = [
  { label: "Pilotos", icon: Flag, path: "/equipe" },
];

const bottomNavItems: NavItem[] = [
  { label: "Pitstop", icon: Settings, path: "/configuracoes" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: userRole } = useUserRole();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const getUserInitials = () => {
    if (!user?.email) return "??";
    const email = user.email;
    return email.substring(0, 2).toUpperCase();
  };

  const getUserName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    return user?.email?.split("@")[0] || "Usuário";
  };

  const getRoleLabel = () => {
    if (!userRole?.role) return "Piloto";
    const labels: Record<string, string> = {
      admin: "Chefe de Equipe",
      sdr: "Piloto SDR",
      closer: "Piloto Closer",
    };
    return labels[userRole.role] || "Piloto";
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
          className="overflow-hidden flex items-center gap-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-primary tracking-tighter">V8</span>
            <span className="text-sidebar-foreground/60 text-xs">by</span>
            <img src={logoDark} alt="Millennials B2B" className="h-6" />
          </div>
        </motion.div>
        {collapsed && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-black text-primary"
          >
            V8
          </motion.span>
        )}
        <div className="flex items-center gap-1">
          {!collapsed && <AlertsDropdown />}
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
        
        {/* Admin Navigation */}
        {userRole?.role === "admin" && (
          <>
            {!collapsed && (
              <div className="pt-3 pb-1">
                <span className="text-xs text-sidebar-foreground/50 uppercase font-medium">Admin</span>
              </div>
            )}
            {adminNavItems.map((item) => (
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
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Performance Widget */}
      <SidebarPerformanceWidget collapsed={collapsed} />

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
            <span className="text-sm font-semibold text-primary-foreground">{getUserInitials()}</span>
          </div>
          <motion.div
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
            className="overflow-hidden flex-1"
          >
            <p className="text-sm font-medium text-sidebar-foreground truncate">{getUserName()}</p>
            <p className="text-xs text-sidebar-foreground/60">{getRoleLabel()}</p>
          </motion.div>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
