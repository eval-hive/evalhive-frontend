"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Search,
  Settings,
  UploadCloud,
  User,
  Users,
} from "lucide-react";
import { getUser, logout } from "@/lib/auth";
import api from "@/lib/api";
import Image from "next/image";
import { DashboardPresentation } from "./DashboardPresentation";

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
  "organization administrator": [
    {
      name: "Organization home",
      href: "/admin/organization",
      icon: Building,
      exact: true,
    },
    {
      name: "People",
      href: "/admin/organization/people",
      icon: Users,
    },
    {
      name: "Cohorts",
      href: "/admin/organization/cohorts",
      icon: FileSpreadsheet,
    },
    { name: "Authoring", href: "/teacher/authoring", icon: FileText },
    { name: "Settings", href: "/admin/organization/settings", icon: Settings },
    { name: "Grading", href: "/teacher/grading", icon: GraduationCap },
    { name: "Results", href: "/teacher/results", icon: BarChart3 },
    { name: "Integrity", href: "/teacher/integrity", icon: Bell },
  ],
  "super administrator": [
    {
      name: "Platform Overview",
      href: "/admin/platform",
      icon: BarChart3,
      exact: true,
    },
    { name: "Organizations", href: "/admin/platform/organizations", icon: Building },
    { name: "Settings", href: "/admin/platform/settings", icon: Settings },
  ],
  student: [
    {
      name: "My Exams",
      href: "/student/dashboard",
      icon: Monitor,
      exact: true,
    },
    { name: "Result history", href: "/student/history", icon: History },
  ],
  teacher: [
    {
      name: "My Dashboard",
      href: "/teacher/dashboard",
      icon: BookOpen,
      exact: true,
    },
    { name: "Authoring", href: "/teacher/authoring", icon: FileText },
    { name: "Grading", href: "/teacher/grading", icon: GraduationCap },
    { name: "Results", href: "/teacher/results", icon: BarChart3 },
    { name: "Integrity", href: "/teacher/integrity", icon: Bell },
  ],
};

const getRoleNavItems = (role: string, fallback: NavItem[]) => {
  const normalized = role.toLowerCase();
  if (normalized.includes("organization admin"))
    return roleNavItems["organization administrator"];
  if (normalized.includes("super")) return roleNavItems["super administrator"];
  if (normalized.includes("student")) return roleNavItems.student;
  if (normalized.includes("teacher")) return roleNavItems.teacher;
  return fallback;
};

const isPathActive = (pathname: string, item: NavItem) => {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
};

export default function DashboardLayout({
  children,
  navItems,
  title,
  role,
}: DashboardLayoutProps) {
  const [user, setUser] = React.useState<ReturnType<typeof getUser>>(null);
  React.useEffect(() => {
    const refreshAuth = () => setUser(getUser());
    refreshAuth();
    window.addEventListener("auth-updated", refreshAuth);
    return () => window.removeEventListener("auth-updated", refreshAuth);
  }, []);
  React.useEffect(() => {
    if (!user?.organizationId || user.organization?.logoUrl) return;
    api
      .get("/auth/me")
      .then((response) => {
        setUser((current) =>
          current
            ? {
                ...current,
                organization: response.data.user.organization || current.organization,
              }
            : current,
        );
      })
      .catch(() => undefined);
  }, [user?.organizationId, user?.organization?.logoUrl]);
  const routePath = usePathname();
  const presentation = React.useContext(DashboardPresentation);
  const { wrap } = presentation;
  const wrapWorkspacePart = (id: string, content: React.ReactNode) =>
    presentation.splitWorkspace ? wrap(id, content) : content;
  const pathname = presentation.activePath || routePath;
  const menuItems = getRoleNavItems(role, navItems);
  const displayName = user?.displayName || role;
  const initial = displayName.charAt(0).toUpperCase();
  const settingsHref = role.toLowerCase().includes("super")
    ? "/admin/platform/settings"
    : role.toLowerCase().includes("organization admin")
      ? "/admin/organization/settings"
      : null;

  const renderNavLink = (item: NavItem, nested = false) => {
    const isActive = isPathActive(pathname, item);
    return (
      <Link
        key={item.name}
        href={item.href}
        className={`
          group flex items-center rounded-lg text-sm font-semibold transition-colors
          ${nested ? "px-3 py-2 text-[13px]" : "px-3 py-2.5"}
          ${
            isActive
              ? "bg-brand-indigo/10 text-brand-indigo"
              : "text-text-secondary hover:bg-background-alt hover:text-text-primary"
          }
        `}
      >
        <item.icon
          className={`mr-3 flex-shrink-0 ${nested ? "h-4 w-4" : "h-5 w-5"} ${isActive ? "text-brand-indigo" : "text-text-secondary group-hover:text-text-primary"}`}
        />
        {item.name}
      </Link>
    );
  };

  const renderNavItem = (item: NavItem, index: number) => {
    if (!item.children?.length)
      return wrap(`nav-${index}`, renderNavLink(item));

    const isActive =
      item.children.some((child) => isPathActive(pathname, child)) ||
      isPathActive(pathname, item);
    const summaryClass = `flex cursor-pointer list-none items-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-all
      [&::-webkit-details-marker]:hidden
      ${isActive ? "bg-brand-indigo/10 text-brand-indigo" : "text-text-secondary hover:bg-background-alt hover:text-text-primary"}`;
    const summaryContent = (
      <>
        <item.icon
          className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? "text-brand-indigo" : "text-text-secondary group-hover/nav:text-text-primary"}`}
        />
        <span className="flex-1">{item.name}</span>
        <ChevronDown className="h-4 w-4 text-text-secondary transition-transform group-open/nav:rotate-180" />
      </>
    );
    return (
      <details
        key={item.name}
        open={isActive || presentation.spatial}
        className="group/nav"
      >
        <summary
          className={
            presentation.spatial
              ? "list-none [&::-webkit-details-marker]:hidden"
              : summaryClass
          }
        >
          {presentation.spatial
            ? wrap(
                `nav-${index}`,
                <div className={summaryClass}>{summaryContent}</div>,
              )
            : summaryContent}
        </summary>
        <div className="nav-children ml-5 mt-1 space-y-1 border-l border-border pl-3">
          {item.children.map((child, childIndex) =>
            wrap(`nav-${index}-${childIndex}`, renderNavLink(child, true)),
          )}
        </div>
      </details>
    );
  };

  return (
    <div className="dashboard-shell h-screen overflow-hidden flex bg-background text-text-primary">
      {presentation.spatial &&
        wrap("page-paint", <div className="absolute inset-0 bg-background" />)}
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 border-r border-border bg-white z-10 transition-all">
        {presentation.spatial &&
          wrap(
            "sidebar-paint",
            <div className="absolute inset-0 border-r border-border bg-white" />,
          )}
        {wrap(
          "brand",
          <Link href={"/"} className="flex h-20 shrink-0 items-center px-6">
            {user?.organization?.logoUrl && user.role !== "super_admin" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.organization.logoUrl}
                alt={`${user.organization.name || "Organization"} logo`}
                className="h-12 w-44 object-contain object-left"
              />
            ) : (
              <Image
                src="/images/logo.png"
                alt="EvalHive Logo"
                width={130}
                height={32}
                className="mr-3"
              />
            )}
          </Link>,
        )}

        <div className="sidebar-scroll flex flex-1 flex-col overflow-y-auto">
          <nav className="flex-1 space-y-1 px-4 py-6">
            {wrap(
              "role",
              <div className="text-[11px] font-bold text-text-secondary/70 uppercase tracking-[0.16em] mb-3 px-3">
                {role}
              </div>,
            )}
            {menuItems.map(renderNavItem)}
          </nav>
        </div>

        <div className="sidebar-footer space-y-3 border-t border-border p-4">
          {wrap(
            "profile",
            <div className="flex items-center gap-3 rounded-lg bg-background px-3 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-sm font-bold text-brand-indigo shadow-sm">
                {user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt="Profile"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-text-primary">
                  {displayName}
                </p>
                <p className="truncate text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  {role}
                </p>
              </div>
            </div>,
          )}
          {wrap(
            "logout",
            <button
              onClick={() => logout()}
              className="group flex w-full items-center rounded-lg bg-brand-indigo/10 px-3 py-2.5 text-sm font-semibold text-brand-indigo transition-colors hover:bg-brand-indigo/15"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>,
          )}
        </div>
      </aside>

      {/* Main Content wrapper */}
      {wrap(
        "workspace",
        <div className="dashboard-workspace flex min-w-0 flex-1 flex-col md:pl-72">
          {/* Top Navbar */}
          {wrapWorkspacePart(
            "header",
            <header className="z-10 flex h-20 flex-shrink-0 items-center gap-x-4 border-b border-border bg-white/95 px-4 backdrop-blur sm:gap-x-6 sm:px-6 lg:px-8">
              <button
                type="button"
                className="-m-2.5 p-2.5 text-text-secondary md:hidden"
              >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>

              {/* Separator */}
              <div className="h-6 w-px bg-border md:hidden" />

              <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-between items-center">
                <div>
                  <p className="hidden text-sm font-semibold text-text-secondary sm:block">
                    Dashboard <span className="mx-1 text-border">/</span>{" "}
                    <span className="text-text-primary">{title}</span>
                  </p>
                </div>
                <div className="flex items-center gap-x-2 sm:gap-x-3 lg:gap-x-4 ml-auto">
                  <button
                    type="button"
                    className="rounded-lg p-2.5 text-text-secondary transition-colors hover:bg-background-alt hover:text-text-primary"
                  >
                    <span className="sr-only">View notifications</span>
                    <Bell className="h-5 w-5" aria-hidden="true" />
                  </button>

                  {settingsHref ? (
                    <Link
                      href={settingsHref}
                      className="hidden rounded-lg p-2.5 text-text-secondary transition-colors hover:bg-background-alt hover:text-text-primary sm:inline-flex"
                    >
                      <span className="sr-only">Settings</span>
                      <Settings className="h-5 w-5" aria-hidden="true" />
                    </Link>
                  ) : null}

                  <div className="hidden lg:block lg:h-8 lg:w-px lg:bg-border" />

                  <div className="flex items-center gap-x-3 pl-1">
                    <span className="sr-only">Your profile</span>
                    <div className="hidden text-right lg:block">
                      <p className="max-w-56 truncate text-sm font-bold text-text-primary">
                        {displayName}
                      </p>
                    </div>
                    <div className="h-11 w-11 rounded-full border border-border bg-white flex items-center justify-center text-brand-indigo font-bold shadow-sm">
                      {user?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatarUrl}
                          alt="Profile"
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        initial || <User className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </header>,
          )}

          {/* Main Content Area */}
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-10">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[1500px] mx-auto">
              {children}
            </div>
          </main>
        </div>,
      )}
    </div>
  );
}
