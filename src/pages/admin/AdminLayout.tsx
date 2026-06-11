import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Paintbrush, Crop, BarChart3, Settings, LogOut, Package, Share2 } from "lucide-react";
import { motion } from "framer-motion";

const sidebarLinks = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard, href: "/admin" },
  { id: "curator", label: "Visual Curator", icon: Paintbrush, href: "/admin/curator" },
  { id: "editor", label: "Preview Editor", icon: Crop, href: "/admin/editor" },
  { id: "products", label: "All Products", icon: Package, href: "/admin/products" },
  { id: "pinterest", label: "Pinterest Queue", icon: Share2, href: "/admin/pinterest" },
  { id: "analytics", label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-[#F9F8F4] font-sans selection:bg-primary/20">
      {/* Sidebar */}
      <aside className="w-64  bg-background/50 backdrop-blur-md flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <Link href="/" className="font-serif text-xl tracking-widest uppercase block mb-1">
            Surnoor Art
          </Link>
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium">
            Admin Console
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = location === link.href;
            const Icon = link.icon;
            
            return (
              <Link key={link.id} href={link.href}>
                <div className={`
                  flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-300 group
                  ${isActive ? "bg-primary text-background" : "text-muted-foreground hover:bg-card hover:text-foreground"}
                `}>
                  <Icon className={`w-4 h-4 ${isActive ? "text-background" : "group-hover:text-primary"} transition-colors`} />
                  <span className="text-xs tracking-[0.15em] uppercase font-medium">{link.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="active-pill" 
                      className="ml-auto w-1 h-4 bg-background/50 rounded-full" 
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 ">
          <Link href="/">
            <div className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-destructive transition-colors cursor-pointer text-xs tracking-[0.15em] uppercase font-medium">
              <LogOut className="w-4 h-4" />
              <span>Back to Site</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
