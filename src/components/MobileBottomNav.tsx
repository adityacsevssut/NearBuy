"use client";

import { usePathname } from "next/navigation";
import { Home, Search, ClipboardList, User } from "lucide-react";

const tabs = [
  { id: "mobile-nav-home", label: "Home", icon: Home, href: "/" },
  { id: "mobile-nav-search", label: "Search", icon: Search, href: "/search" },
  { id: "mobile-nav-orders", label: "Orders", icon: ClipboardList, href: "/orders" },
  { id: "mobile-nav-profile", label: "Profile", icon: User, href: "/profile" },
];

export default function MobileBottomNav() {
  /**
   * Visible only on mobile (< md breakpoint).
   * On mobile, the top Navbar simplifies to: Logo + Location Pill + Cart only.
   * This bottom nav handles primary navigation: Home, Search, Orders, Profile.
   * TODO: When routes are added, pathname-based active state will work automatically.
   */
  const pathname = usePathname();

  return (
    <nav
      id="mobile-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden
        bg-white/90 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ id, label, icon: Icon, href }) => {
          const active = pathname === href;
          return (
            <a
              key={id}
              id={id}
              href={href}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 group"
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 ${
                  active ? "bg-emerald-100" : "group-hover:bg-gray-100"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    active ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"
                  }`}
                />
              </div>
              <span
                className={`text-[10px] font-semibold transition-colors duration-200 ${
                  active ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-500"
                }`}
              >
                {label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
