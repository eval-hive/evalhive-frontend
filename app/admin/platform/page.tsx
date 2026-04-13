'use client';

import { 
  Building, 
  Users, 
  Settings, 
  BarChart3,
  Globe
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const navItems = [
  { name: 'Platform Overview', href: '/admin/platform', icon: BarChart3 },
  { name: 'Schools', href: '/admin/platform/schools', icon: Building },
  { name: 'Global Settings', href: '/admin/platform/settings', icon: Settings },
];

export default function SuperAdminDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="Platform Admin" role="Super Administrator">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder Stat Cards */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-brand-indigo/10">
              <Building className="h-6 w-6 text-brand-indigo" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Registered Schools</p>
              <p className="text-2xl font-bold text-text-primary">1</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-brand-gold/10">
              <Users className="h-6 w-6 text-brand-gold" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Total Users</p>
              <p className="text-2xl font-bold text-text-primary">13</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-brand-emerald/10">
              <Globe className="h-6 w-6 text-brand-emerald" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Platform Status</p>
              <p className="text-2xl font-bold text-text-primary">Active</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Platform Activity</h2>
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="p-12 text-center text-text-secondary">
            Activity stream placeholder for upcoming SaaS layer updates.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
