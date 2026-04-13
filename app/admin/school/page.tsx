'use client';

import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const navItems = [
  { name: 'School Dashboard', href: '/admin/school', icon: BuildingIcon },
  { name: 'Subjects', href: '/admin/school/subjects', icon: BookOpen },
  { name: 'Teachers', href: '/admin/school/teachers', icon: Users },
  { name: 'Students', href: '/admin/school/students', icon: GraduationCap },
  { name: 'Exams', href: '/admin/school/exams', icon: FileSpreadsheet },
  { name: 'Results', href: '/admin/school/results', icon: FileSpreadsheet },
];

function BuildingIcon(props: any) {
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
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  )
}

export default function SchoolAdminDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="School Administration" role="School Admin">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 border-b border-border pb-8">
        {[
          { label: 'Active Students', value: '10', color: 'indigo' },
          { label: 'Active Teachers', value: '2', color: 'emerald' },
          { label: 'Pending Exams', value: '0', color: 'gold' },
          { label: 'Published Results', value: '0', color: 'indigo' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <p className="text-sm font-medium text-text-secondary">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Bulk Data Management</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          
          {/* CSV Import Students placeholder card */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm flex flex-col items-center justify-center text-center hover:border-brand-indigo/50 transition-colors cursor-pointer">
            <div className="h-12 w-12 rounded-full bg-brand-indigo/10 flex items-center justify-center mb-4">
              <UploadCloud className="h-6 w-6 text-brand-indigo" />
            </div>
            <h3 className="text-lg font-medium text-text-primary">Import Students (CSV)</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Upload a bulk CSV list of new students for the current session.
            </p>
            <button className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-indigo hover:bg-brand-indigo/90 focus:outline-none">
              Upload File
            </button>
          </div>

          {/* CSV Import Teachers placeholder card */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm flex flex-col items-center justify-center text-center hover:border-brand-emerald/50 transition-colors cursor-pointer">
            <div className="h-12 w-12 rounded-full bg-brand-emerald/10 flex items-center justify-center mb-4">
              <UploadCloud className="h-6 w-6 text-brand-emerald" />
            </div>
            <h3 className="text-lg font-medium text-text-primary">Import Teachers (CSV)</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Upload a bulk CSV list of new teachers.
            </p>
            <button className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-emerald hover:bg-brand-emerald/90 focus:outline-none">
              Upload File
            </button>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
