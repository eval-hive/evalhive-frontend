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
  PlayCircle,
  Search,
  UploadCloud,
  User,
  Users,
} from 'lucide-react';
import { logout } from '@/lib/auth';

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

  const renderNavLink = (item: NavItem, nested = false) => {
    const isActive = isPathActive(pathname, item);
    return (
      <Link
        key={item.name}
        href={item.href}
        className={`
          group flex items-center rounded-lg text-sm font-semibold transition-all
          ${nested ? 'px-3 py-2 text-[13px]' : 'px-3 py-2.5'}
          ${isActive
            ? 'bg-white text-brand-indigo shadow-[0_1px_2px_rgba(17,24,39,0.04)]'
            : 'text-white/75 hover:bg-white/10 hover:text-white'
          }
        `}
      >
        <item.icon className={`mr-3 flex-shrink-0 ${nested ? 'h-4 w-4' : 'h-5 w-5'} ${isActive ? 'text-brand-indigo' : 'text-white/70 group-hover:text-white'}`} />
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
            ${isActive ? 'bg-white/10 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'}
          `}
        >
          <item.icon className="mr-3 h-5 w-5 flex-shrink-0 text-white/70 group-hover/nav:text-white" />
          <span className="flex-1">{item.name}</span>
          <ChevronDown className="h-4 w-4 text-white/55 transition-transform group-open/nav:rotate-180" />
        </summary>
        <div className="ml-5 mt-1 space-y-1 border-l border-white/10 pl-3">
          {item.children.map(child => renderNavLink(child, true))}
        </div>
      </details>
    );
  };

  return (
    <div className="min-h-screen flex bg-background text-text-primary">
      {/* Sidebar */}
      <div className="hidden md:flex w-72 flex-col fixed inset-y-0 bg-brand-indigo z-10 transition-all shadow-2xl shadow-brand-indigo/20">
        <div className="flex h-20 shrink-0 items-center px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gold text-sm font-black text-brand-indigo shadow-lg shadow-black/10">
              EH
            </div>
            <div>
              <span className="block text-xl font-bold tracking-tight text-white">Eval Hive</span>
              <span className="block text-xs font-medium text-white/55">School CBT Suite</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-1 flex-col overflow-y-auto">
          <nav className="flex-1 space-y-1 px-4 py-5">
            <div className="text-[11px] font-bold text-white/45 uppercase tracking-[0.16em] mb-3 px-3">
              {role}
            </div>
            {menuItems.map(renderNavItem)}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => logout()}
            className="group flex w-full items-center px-3 py-2.5 text-sm font-semibold rounded-lg text-white/75 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-white/70 group-hover:text-white" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content wrapper */}
      <div className="flex flex-1 flex-col md:pl-72">
        {/* Top Navbar */}
        <header className="sticky top-0 z-10 flex h-20 flex-shrink-0 items-center gap-x-4 border-b border-border bg-white/90 px-4 backdrop-blur sm:gap-x-6 sm:px-6 lg:px-8">
          <button type="button" className="-m-2.5 p-2.5 text-text-secondary md:hidden">
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-border md:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-secondary hidden sm:block">{role}</p>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary hidden sm:block">{title}</h1>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
              <div className="hidden xl:flex h-10 w-80 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-text-secondary">
                <Search className="h-4 w-4" />
                <span>Search students, exams, results</span>
              </div>

              <button type="button" className="rounded-lg border border-border bg-white p-2.5 text-text-secondary hover:border-brand-indigo/30 hover:text-brand-indigo transition-colors">
                <span className="sr-only">View notifications</span>
                <Bell className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" />

              <div className="flex items-center gap-x-4">
                <span className="sr-only">Your profile</span>
                <div className="h-10 w-10 rounded-lg bg-brand-indigo/10 flex items-center justify-center text-brand-indigo font-bold ring-1 ring-brand-indigo/10">
                  <User className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 pb-10">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[1500px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
