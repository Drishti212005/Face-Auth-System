import { Link, useLocation } from "wouter";
import { UserPlus, LayoutDashboard, Monitor } from "lucide-react";

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Monitor, label: "Kiosk" },
    { href: "/register", icon: UserPlus, label: "Register" },
    { href: "/admin", icon: LayoutDashboard, label: "Admin" },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-panel rounded-full px-2 py-2 flex items-center gap-1 shadow-2xl shadow-primary/10">
      {navItems.map((item) => {
        const isActive = location === item.href;
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300
              ${isActive 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105" 
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"}
            `}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium font-display text-sm">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
