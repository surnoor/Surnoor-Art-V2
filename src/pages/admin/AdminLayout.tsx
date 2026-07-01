import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Crop, LogOut, Share2, Menu, X, LayoutTemplate, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const sidebarLinks = [
  { id: "archive", label: "Archive Manager", icon: Database, href: "/admin/archive" },
  { id: "pinterest", label: "Pinterest Queue", icon: Share2, href: "/admin/pinterest" },
  { id: "instagram", label: "Instagram Console", icon: Crop, href: "/admin/instagram" },
  { id: "exhibitions", label: "Exhibition Planner", icon: LayoutTemplate, href: "/admin/exhibitions" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F4F5F7] font-sans selection:bg-zinc-200">
      
      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md border-b border-zinc-200 z-30 flex items-center justify-between px-5">
        <Link href="/" className="font-serif text-base tracking-widest uppercase font-semibold">
          Surnoor Art
        </Link>
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5 text-zinc-700" />
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[220px] bg-white border-r border-zinc-200 flex flex-col transition-transform duration-300 ease-in-out
        lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Header */}
        <div className="px-4 pt-5 pb-4 flex items-center justify-between border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white text-[11px] font-bold tracking-wide font-serif">S</span>
            </div>
            <div>
              <Link href="/" className="font-serif text-[13px] tracking-wider uppercase font-semibold text-zinc-900 hover:opacity-70 transition-opacity block leading-tight">
                Surnoor Art
              </Link>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span className="text-[9px] tracking-[0.18em] uppercase text-zinc-400 font-semibold">Admin Console</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 hover:bg-zinc-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-4">
          <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-400 px-2.5 mb-2">Workspace</p>
          <div className="space-y-0.5">
            {sidebarLinks.map((link) => {
              const isActive = location === link.href || location.startsWith(link.href + "/");
              const Icon = link.icon;
              return (
                <Link key={link.id} href={link.href} onClick={() => setIsOpen(false)}>
                  <div className={`
                    flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg cursor-pointer transition-all duration-100 group
                    ${isActive
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900"
                    }
                  `}>
                    <Icon className={`w-[14px] h-[14px] shrink-0 transition-colors ${isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-700"}`} />
                    <span className="text-[12px] font-medium">{link.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-2.5 pb-5 pt-3 border-t border-zinc-100">
          <Link href="/">
            <div className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer">
              <LogOut className="w-[14px] h-[14px] shrink-0" />
              <span className="text-[12px] font-medium">Back to Site</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-14 lg:pt-0 overflow-y-auto min-h-screen bg-[#F4F5F7]">
        <motion.div
          className="flex flex-col flex-1 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.12 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
