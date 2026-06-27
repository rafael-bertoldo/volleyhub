"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface ShellNavProps {
  items: NavItem[];
  variant: "sidebar" | "bottom";
}

export function ShellNav({ items, variant }: ShellNavProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/" || href === "/a" || href === "/admin") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  if (variant === "sidebar") {
    return (
      <nav className="flex flex-col gap-1 p-3">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-violet-600 text-white"
                  : "text-violet-200 hover:bg-violet-700/50 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="bg-amber-400 text-amber-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex justify-around items-stretch max-w-lg mx-auto">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2.5 text-xs font-medium transition-colors ${
                active ? "text-violet-600" : "text-gray-400 hover:text-violet-500"
              }`}
            >
              {item.badge ? (
                <span className="absolute top-1.5 right-1/4 bg-amber-400 text-amber-900 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
