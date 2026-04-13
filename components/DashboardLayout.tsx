import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Menu, User, Bell } from 'lucide-react';
import { logout } from '@/lib/auth';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title: string;
  role: string;
}

export default function DashboardLayout({ children, navItems, title, role }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 bg-brand-indigo z-10 transition-all">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-white/10">
          <span className="text-xl font-bold tracking-tight text-white">Eval Hive</span>
        </div>
        
        <div className="flex flex-1 flex-col overflow-y-auto">
          <nav className="flex-1 space-y-1 px-3 py-4">
            <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 px-3">
              {role}
            </div>
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-white/10 text-white' 
                      : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => logout()}
            className="group flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg text-white/80 hover:bg-white/5 hover:text-brand-red transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-white/80 group-hover:text-brand-red" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content wrapper */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-border bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8 shadow-sm">
          <button type="button" className="-m-2.5 p-2.5 text-text-secondary md:hidden">
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-border md:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-between items-center">
            <h1 className="text-xl font-semibold text-text-primary hidden sm:block">{title}</h1>
            <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
              <button type="button" className="-m-2.5 p-2.5 text-text-secondary hover:text-text-primary">
                <span className="sr-only">View notifications</span>
                <Bell className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" />

              <div className="flex items-center gap-x-4">
                <span className="sr-only">Your profile</span>
                <div className="h-8 w-8 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold font-bold">
                  <User className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 pb-10">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
