'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bell,
  BookOpen,
  Building,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  History,
  LogOut,
  Menu,
  Monitor,
  Moon,
  PlayCircle,
  Search,
  Settings,
  UploadCloud,
  User,
  Users,
} from 'lucide-react';
import { getUser, logout } from '@/lib/auth';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
  children?: NavItem[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title: string;
  role: string;
}

const roleNavItems: Record<string, NavItem[]> = {
  'school admin': [
    { name: 'School Dashboard', href: '/admin/school', icon: Building, exact: true },
    {
      name: 'Academics',
      href: '/admin/school/subjects',
      icon: BookOpen,
      children: [
        { name: 'Subjects', href: '/admin/school/subjects', icon: BookOpen },
        { name: 'Teachers', href: '/admin/school/teachers', icon: Users },
        { name: 'Students', href: '/admin/school/students', icon: GraduationCap },
      ],
    },
    {
      name: 'Exams',
      href: '/admin/school/exams',
      icon: FileSpreadsheet,
      children: [
        { name: 'All Exams', href: '/admin/school/exams', icon: FileSpreadsheet, exact: true },
        { name: 'Create Exam', href: '/admin/school/exams/create', icon: FileText },
        { name: 'Import Questions', href: '/admin/school/import', icon: UploadCloud },
      ],
    },
    { name: 'Results', href: '/admin/school/results', icon: BarChart3 },
  ],
  'super administrator': [
    { name: 'Platform Overview', href: '/admin/platform', icon: BarChart3, exact: true },
    { name: 'Schools', href: '/admin/platform/schools', icon: Building },
  ],
  student: [
    { name: 'My Exams', href: '/student/dashboard', icon: Monitor, exact: true },
    {
      name: 'Mock Exams',
      href: '/student/mock',
      icon: PlayCircle,
      children: [
        { name: 'JAMB Mock', href: '/student/mock/jamb', icon: PlayCircle },
        { name: 'WAEC Mock', href: '/student/mock/waec', icon: PlayCircle },
        { name: 'Mock Analytics', href: '/student/analytics', icon: BarChart3 },
      ],
    },
    { name: 'History & Results', href: '/student/history', icon: History },
  ],
  teacher: [
    { name: 'My Dashboard', href: '/teacher/dashboard', icon: BookOpen, exact: true },
    {
      name: 'Exams',
      href: '/teacher/exams',
      icon: FileText,
      children: [
        { name: 'My Exams', href: '/teacher/exams', icon: FileText, exact: true },
        { name: 'Create Exam', href: '/teacher/exams/create', icon: FileSpreadsheet },
      ],
    },
    {
      name: 'Classes',
      href: '/teacher/classes',
      icon: Users,
      children: [
        { name: 'My Classes', href: '/teacher/classes', icon: Users, exact: true },
        { name: 'Class Overview', href: '/teacher/class', icon: GraduationCap },
      ],
    },
  ],
};

const getRoleNavItems = (role: string, fallback: NavItem[]) => {
  const normalized = role.toLowerCase();
  if (normalized.includes('school admin')) return roleNavItems['school admin'];
  if (normalized.includes('super')) return roleNavItems['super administrator'];
  if (normalized.includes('student')) return roleNavItems.student;
  if (normalized.includes('teacher')) return roleNavItems.teacher;
  return fallback;
};

const isPathActive = (pathname: string, item: NavItem) => {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
};

export default function DashboardLayout({ children, navItems, title, role }: DashboardLayoutProps) {
  const pathname = usePathname();
  const menuItems = getRoleNavItems(role, navItems);
  const user = getUser();
  const displayName = user?.displayName || role;
  const initial = displayName.charAt(0).toUpperCase();

  const renderNavLink = (item: NavItem, nested = false) => {
    const isActive = isPathActive(pathname, item);
    return (
      <Link
        key={item.name}
        href={item.href}
        className={`
          group flex items-center rounded-lg text-sm font-semibold transition-colors
          ${nested ? 'px-3 py-2 text-[13px]' : 'px-3 py-2.5'}
          ${isActive
            ? 'bg-brand-indigo/10 text-brand-indigo'
            : 'text-text-secondary hover:bg-background-alt hover:text-text-primary'
          }
        `}
      >
        <item.icon className={`mr-3 flex-shrink-0 ${nested ? 'h-4 w-4' : 'h-5 w-5'} ${isActive ? 'text-brand-indigo' : 'text-text-secondary group-hover:text-text-primary'}`} />
        {item.name}
      </Link>
    );
  };

  const renderNavItem = (item: NavItem) => {
    if (!item.children?.length) return renderNavLink(item);

    const isActive = item.children.some(child => isPathActive(pathname, child)) || isPathActive(pathname, item);
    return (
      <details key={item.name} open={isActive} className="group/nav">
        <summary
          className={`
            flex cursor-pointer list-none items-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-all
            [&::-webkit-details-marker]:hidden
            ${isActive ? 'bg-brand-indigo/10 text-brand-indigo' : 'text-text-secondary hover:bg-background-alt hover:text-text-primary'}
          `}
        >
          <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-brand-indigo' : 'text-text-secondary group-hover/nav:text-text-primary'}`} />
          <span className="flex-1">{item.name}</span>
          <ChevronDown className="h-4 w-4 text-text-secondary transition-transform group-open/nav:rotate-180" />
        </summary>
        <div className="ml-5 mt-1 space-y-1 border-l border-border pl-3">
          {item.children.map(child => renderNavLink(child, true))}
        </div>
      </details>
    );
  };

  return (
    <div className="h-screen overflow-hidden flex bg-background text-text-primary">
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 border-r border-border bg-white z-10 transition-all">
        <div className="flex h-20 shrink-0 items-center px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-gold text-sm font-black text-brand-indigo shadow-sm">
              EH
            </div>
            <div>
              <span className="block text-xl font-bold tracking-tight text-text-primary">Eval Hive</span>
              <span className="block text-xs font-medium text-text-secondary">School CBT Suite</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-1 flex-col overflow-y-auto">
          <nav className="flex-1 space-y-1 px-4 py-6">
            <div className="text-[11px] font-bold text-text-secondary/70 uppercase tracking-[0.16em] mb-3 px-3">
              {role}
            </div>
            {menuItems.map(renderNavItem)}
          </nav>
        </div>

        <div className="space-y-3 border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-background px-3 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-sm font-bold text-brand-indigo shadow-sm">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-text-primary">{displayName}</p>
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-text-secondary">{role}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="group flex w-full items-center rounded-lg bg-brand-indigo/10 px-3 py-2.5 text-sm font-semibold text-brand-indigo transition-colors hover:bg-brand-indigo/15"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content wrapper */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-72">
        {/* Top Navbar */}
        <header className="z-10 flex h-20 flex-shrink-0 items-center gap-x-4 border-b border-border bg-white/95 px-4 backdrop-blur sm:gap-x-6 sm:px-6 lg:px-8">
          <button type="button" className="-m-2.5 p-2.5 text-text-secondary md:hidden">
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-border md:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-between items-center">
            <div>
              <p className="hidden text-sm font-semibold text-text-secondary sm:block">
                Dashboard <span className="mx-1 text-border">/</span> <span className="text-text-primary">{title}</span>
              </p>
            </div>
            <div className="flex items-center gap-x-2 sm:gap-x-3 lg:gap-x-4 ml-auto">
              <button type="button" className="hidden rounded-lg p-2.5 text-text-secondary transition-colors hover:bg-background-alt hover:text-text-primary sm:inline-flex">
                <span className="sr-only">Toggle theme</span>
                <Moon className="h-5 w-5" aria-hidden="true" />
              </button>

              <button type="button" className="hidden rounded-lg p-2.5 text-text-secondary transition-colors hover:bg-background-alt hover:text-text-primary sm:inline-flex">
                <span className="sr-only">Search</span>
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>

              <button type="button" className="rounded-lg p-2.5 text-text-secondary transition-colors hover:bg-background-alt hover:text-text-primary">
                <span className="sr-only">View notifications</span>
                <Bell className="h-5 w-5" aria-hidden="true" />
              </button>

              <button type="button" className="hidden rounded-lg p-2.5 text-text-secondary transition-colors hover:bg-background-alt hover:text-text-primary sm:inline-flex">
                <span className="sr-only">Settings</span>
                <Settings className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="hidden lg:block lg:h-8 lg:w-px lg:bg-border" />

              <div className="flex items-center gap-x-3 pl-1">
                <span className="sr-only">Your profile</span>
                <div className="hidden text-right lg:block">
                  <p className="max-w-56 truncate text-sm font-bold text-text-primary">{displayName}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-indigo">Live</p>
                </div>
                <div className="h-11 w-11 rounded-full border border-border bg-white flex items-center justify-center text-brand-indigo font-bold shadow-sm">
                  {initial || <User className="h-5 w-5" />}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-10">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[1500px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
