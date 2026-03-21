"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Wrench, 
  Settings, 
  LogOut, 
  Menu, 
  UserCircle,
  Bot
} from "lucide-react";
import { useAdminStore } from "@/store/admin-store";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Zustand State
  const isSidebarCollapsed = useAdminStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useAdminStore((state) => state.toggleSidebar);
  const adminUser = useAdminStore((state) => state.adminUser);
  const clearStore = useAdminStore((state) => state.clearStore);

  const handleLogout = () => {
    // Clear the cookie by setting it to expire in the past
    document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    clearStore();
    router.push("/login");
  };

  const navItems = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Fleet Command", href: "/admin/commerce/fleet", icon: Package },
    { name: "Service Ops", href: "/admin/commerce/service", icon: Wrench },
    { name: "System Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`border-r border-zinc-800/60 bg-zinc-950 transition-all duration-300 flex flex-col ${isSidebarCollapsed ? "w-16" : "w-64"}`}>
        <div className="h-16 flex items-center justify-center border-b border-zinc-800/60 px-4">
          <Bot className="text-blue-500 shrink-0" size={24} />
          {!isSidebarCollapsed && <span className="ml-3 font-bold tracking-wide">V_SHOP<span className="text-blue-500">OS</span></span>}
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? "bg-blue-600/10 text-blue-500" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"}`}
              >
                <Icon size={18} className="shrink-0" />
                {!isSidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800/60">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-colors">
            <LogOut size={18} className="shrink-0" />
            {!isSidebarCollapsed && <span className="text-sm font-medium">Terminate Session</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-800/60 bg-zinc-950 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-zinc-400 hover:text-zinc-100">
              <Menu size={20} />
            </Button>
            <span className="font-medium text-zinc-200">Command Center</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-zinc-200">{adminUser?.email || "Admin Node"}</p>
              <p className="text-xs text-zinc-500 capitalize">{adminUser?.role || "System Admin"}</p>
            </div>
            <UserCircle size={28} className="text-zinc-400" />
          </div>
        </header>

        {/* Page Content Injection */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#09090b]">
          {children}
        </main>
      </div>
    </div>
  );
}