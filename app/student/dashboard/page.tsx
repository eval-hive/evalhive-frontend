'use client';

import { 
  Monitor, 
  History, 
  BarChart,
  PlayCircle
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const navItems = [
  { name: 'My Exams', href: '/student/dashboard', icon: Monitor },
  { name: 'History & Results', href: '/student/history', icon: History },
  { name: 'Mock Analytics', href: '/student/analytics', icon: BarChart },
];

export default function StudentDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="My Exams" role="Student">
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Active Exams</h2>
        
        {/* Placeholder for when no exams are active */}
        <div className="bg-card rounded-xl border border-border p-12 text-center shadow-sm">
          <Monitor className="mx-auto h-12 w-12 text-text-secondary/40" />
          <h3 className="mt-4 text-sm font-medium text-text-primary">No exams available</h3>
          <p className="mt-1 text-sm text-text-secondary">
            There are no exams currently active for your class.
          </p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Practice Exams (Mock)</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:border-brand-gold/50 transition-colors cursor-pointer group">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-text-primary group-hover:text-brand-gold transition-colors">JAMB Mock</h3>
                <p className="text-sm text-text-secondary mt-1">4 Subjects • Time limit: 2hrs</p>
              </div>
              <PlayCircle className="h-6 w-6 text-brand-gold" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:border-brand-indigo/50 transition-colors cursor-pointer group">
             <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-text-primary group-hover:text-brand-indigo transition-colors">WAEC Mock</h3>
                <p className="text-sm text-text-secondary mt-1">Single Subject • Select to start</p>
              </div>
              <PlayCircle className="h-6 w-6 text-brand-indigo" />
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
