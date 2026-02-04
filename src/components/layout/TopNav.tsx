import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Visão Geral", href: "/dashboard" },
  { name: "Finanças", href: "/dashboard/finances" },
  { name: "Saúde", href: "/dashboard/health" },
  { name: "Acadêmico", href: "/dashboard/academic" },
  { name: "Agenda", href: "/dashboard/schedule" },
];

export function TopNav() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">

        {/* Logo - Left */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <img
            src="/logo-icon-fundo.png"
            alt="Foca.aí"
            className="w-14 object-contain"
          />
          <span className="text-xl font-bold tracking-tight">Foca.aí</span>
        </Link>

        {/* Navigation - Center (hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.href} to={item.href}>
                <motion.div
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {item.name}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Right Area - Espaço vazio para manter o equilíbrio do layout (justify-between) */}
        <div className="w-10" /> 
      </div>
    </header>
  );
}