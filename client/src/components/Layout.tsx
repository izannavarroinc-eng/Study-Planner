import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Calendar as CalIcon, Home, Settings as SettingsIcon, Menu, X } from "lucide-react";
import { useTranslation } from "@/lib/store";
import { cn } from "@/components/ui/shared";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const navItems = [
    { href: "/", icon: Home, label: t('dashboard') },
    { href: "/subjects", icon: BookOpen, label: t('subjects') },
    { href: "/calendar", icon: CalIcon, label: t('calendar') },
    { href: "/settings", icon: SettingsIcon, label: t('settings') },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans text-foreground transition-colors duration-300">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 glass sticky top-0 z-40 border-b border-border/50">
        <div className="flex items-center gap-2 font-display font-bold text-xl text-primary">
          <BookOpen className="w-6 h-6" />
          <span>StudyPlan</span>
        </div>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-xl bg-secondary text-foreground">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl md:hidden flex flex-col p-6"
          >
            <div className="flex justify-end mb-8">
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl bg-secondary">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => {
                const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                    <div className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl font-semibold text-lg transition-all",
                      isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-secondary/50 text-foreground/70 hover:bg-secondary"
                    )}>
                      <item.icon className="w-6 h-6" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-72 h-screen sticky top-0 border-r border-border/50 bg-card/50 backdrop-blur-xl p-6">
        <div className="flex items-center gap-3 font-display font-bold text-2xl text-gradient mb-12 px-2">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <BookOpen className="w-7 h-7 text-primary" />
          </div>
          StudyPlan
        </div>
        
        <nav className="flex flex-col gap-3 flex-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-2xl font-medium transition-all cursor-pointer group relative overflow-hidden",
                  isActive ? "text-primary bg-primary/10" : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                )}>
                  {isActive && (
                    <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-primary/10 rounded-2xl border border-primary/20" />
                  )}
                  <item.icon className={cn("w-5 h-5 relative z-10 transition-transform group-hover:scale-110", isActive ? "text-primary" : "")} />
                  <span className="relative z-10">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto overflow-x-hidden">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
