import { ShellNav, type NavItem } from "./shell-nav";

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  brand: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  accent?: "violet" | "purple";
}

export function AppShell({
  children,
  navItems,
  brand,
  subtitle,
  headerActions,
  accent = "violet",
}: AppShellProps) {
  const sidebarBg = accent === "violet" ? "bg-violet-800" : "bg-violet-900";

  return (
    <div className="min-h-full flex bg-gray-50">
      {/* Sidebar — desktop */}
      <aside
        className={`hidden md:flex flex-col w-56 shrink-0 ${sidebarBg} text-white min-h-screen sticky top-0`}
      >
        <div className="px-4 py-5 border-b border-violet-700/50">
          <p className="text-lg font-bold leading-tight">{brand}</p>
          {subtitle && (
            <p className="text-violet-300 text-xs mt-1 truncate">{subtitle}</p>
          )}
        </div>
        <ShellNav items={navItems} variant="sidebar" />
        {headerActions && (
          <div className="mt-auto p-3 border-t border-violet-700/50">
            {headerActions}
          </div>
        )}
      </aside>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header mobile */}
        <header className={`md:hidden ${sidebarBg} text-white px-4 py-4 flex items-center justify-between gap-3`}>
          <div className="min-w-0">
            <p className="font-bold truncate">{brand}</p>
            {subtitle && (
              <p className="text-violet-300 text-xs truncate">{subtitle}</p>
            )}
          </div>
          {headerActions}
        </header>

        <main className="flex-1 p-4 pb-24 md:pb-6 max-w-3xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <div className="md:hidden">
        <ShellNav items={navItems} variant="bottom" />
      </div>
    </div>
  );
}
