'use client';

import { 
  BookOpen, 
  FileText, 
  CheckCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

const navItems = [
  { name: 'My Dashboard', href: '/teacher/dashboard', icon: BookOpen },
  { name: 'My Exams', href: '/teacher/exams', icon: FileText },
  { name: 'My Classes', href: '/teacher/classes', icon: UsersIcon },
  { name: 'Results', href: '/teacher/results', icon: CheckCircle },
];

function UsersIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export default function TeacherDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="Teacher Dashboard" role="Subject Teacher">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <div className="bg-card rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-brand-indigo/10">
              <FileText className="h-6 w-6 text-brand-indigo" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Draft Exams</p>
              <p className="text-2xl font-bold text-text-primary">0</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-brand-gold/10">
              <Clock className="h-6 w-6 text-brand-gold" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Pending Approval</p>
              <p className="text-2xl font-bold text-text-primary">0</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-brand-emerald/10">
              <CheckCircle className="h-6 w-6 text-brand-emerald" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Approved Exams</p>
              <p className="text-2xl font-bold text-text-primary">0</p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h2>
      <div className="bg-card rounded-lg border border-border p-8 text-center shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
        <p className="text-text-secondary mb-6">You haven't created any exams yet.</p>
        <Link href="/teacher/exams/create" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-[0_1px_2px_rgba(17,24,39,0.04)] text-white bg-brand-indigo hover:bg-brand-indigo/90 focus:outline-none">
          Create New Exam
        </Link>
      </div>
    </DashboardLayout>
  );
}
