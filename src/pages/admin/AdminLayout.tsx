import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Crop, LogOut, Share2, Menu, X, LayoutTemplate } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const sidebarLinks = [
  { id: "pinterest", label: "Pinterest Queue", icon: Share2, href: "/admin" },
  { id: "instagram", label: "Instagram Console", icon: Crop, href: "/admin/instagram" },
  { id: "exhibitions", label: "Exhibition Planner", icon: LayoutTemplate, href: "/admin/exhibitions" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F9F8F4] font-sans selection:bg-primary/20">
      
      {/* Mobile Top Header (Visible only on mobile/tablet screens < 1024px) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-30 flex items-center justify-between px-6">
        <Link href="/" className="font-serif text-lg tracking-widest uppercase font-semibold">
          Surnoor Art
        </Link>
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-muted rounded transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6 text-foreground" />
        </button>
      </header>

      {/* Sidebar - Desktop (static) & Mobile Drawer (sliding) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border flex flex-col transition-transform duration-300 ease-in-out
        lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:bg-background/50 lg:backdrop-blur-md
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Sidebar Header */}
        <div className="p-8 flex items-center justify-between">
          <div>
            <Link href="/" className="font-serif text-xl tracking-widest uppercase block mb-1">
              Surnoor Art
            </Link>
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium">
              Admin Console
            </span>
          </div>
          {/* Close button for mobile */}
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 hover:bg-muted rounded transition-colors -mr-2"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = location === link.href;
            const Icon = link.icon;
            
            return (
              <Link key={link.id} href={link.href} onClick={() => setIsOpen(false)}>
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

        {/* Back to site link */}
        <div className="p-4">
          <Link href="/">
            <div className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-destructive transition-colors cursor-pointer text-xs tracking-[0.15em] uppercase font-medium">
              <LogOut className="w-4 h-4" />
              <span>Back to Site</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Backdrop overlay for mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 pt-24 lg:pt-12 overflow-y-auto min-h-screen">
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
