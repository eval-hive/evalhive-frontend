"use client";
import { BarChart3, Building, Settings } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import AccountSettings from "@/components/AccountSettings";
const navItems = [{ name: "Platform Overview", href: "/admin/platform", icon: BarChart3 }, { name: "Organizations", href: "/admin/platform/organizations", icon: Building }, { name: "Settings", href: "/admin/platform/settings", icon: Settings }];
export default function PlatformSettingsPage() { return <DashboardLayout navItems={navItems} title="Platform settings" role="Super Administrator"><div className="mx-auto max-w-4xl"><h1 className="text-3xl font-bold">Account settings</h1><p className="mt-2 mb-7 text-text-secondary">Manage the Super Administrator profile and password.</p><AccountSettings/></div></DashboardLayout>; }
