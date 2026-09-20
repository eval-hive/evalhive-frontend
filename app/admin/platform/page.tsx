'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Building, CheckCircle2, ClipboardCheck, GraduationCap, Loader2, School, Users } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { DonutChart, HorizontalBarChart, LineChart } from '@/components/AnalyticsCharts';
import api from '@/lib/api';

const navItems = [
  { name: 'Platform Overview', href: '/admin/platform', icon: BarChart3 },
  { name: 'Schools', href: '/admin/platform/schools', icon: Building },
];

interface PlatformAnalytics {
  overview: { totalSchools: number; activeSchools: number; inactiveSchools: number; pendingSchools: number; totalStudents: number; totalTeachers: number; totalExamsSet: number; conductedExams: number; completedAttempts: number; examsTakenThisMonth: number };
  schoolStatus: { name: string; value: number }[];
  schoolGrowth: { label: string; value: number }[];
  examActivity: { label: string; value: number }[];
  examStatuses: { name: string; value: number }[];
  topSchools: { id: string; name: string; students: number; teachers: number; exams: number; attempts: number }[];
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/super-admin/analytics')
      .then((response) => setAnalytics(response.data.analytics))
      .catch((err) => setError(err.response?.data?.error || 'Unable to load platform analytics.'))
      .finally(() => setLoading(false));
  }, []);

  const stats = analytics ? [
    { label: 'Registered Schools', value: analytics.overview.totalSchools, icon: School },
    { label: 'Active Schools', value: analytics.overview.activeSchools, icon: CheckCircle2 },
    { label: 'Active Students', value: analytics.overview.totalStudents, icon: GraduationCap },
    { label: 'Active Teachers', value: analytics.overview.totalTeachers, icon: Users },
    { label: 'Exams Set', value: analytics.overview.totalExamsSet, icon: ClipboardCheck },
    { label: 'Completed Attempts', value: analytics.overview.completedAttempts, icon: BarChart3 },
  ] : [];

  return (
    <DashboardLayout navItems={navItems} title="Platform Overview" role="Super Administrator">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Platform analytics</h1>
          <p className="mt-1 text-sm text-text-secondary">A live overview of schools, people, and examination activity across Eval Hive.</p>
        </div>
        <button onClick={() => router.push('/admin/platform/schools')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-indigo px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-indigo/90">
          <Building className="h-4 w-4" /> Manage schools
        </button>
      </div>

      {loading && <div className="flex min-h-80 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-indigo" /></div>}
      {error && <div className="rounded-lg border border-brand-red/20 bg-brand-red/5 p-4 text-sm text-brand-red">{error}</div>}

      {analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg border border-border bg-card p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-sm text-text-secondary">{label}</p><p className="mt-2 text-3xl font-bold text-text-primary">{value.toLocaleString()}</p></div>
                  <span className="rounded-lg bg-brand-indigo/10 p-2.5 text-brand-indigo"><Icon className="h-5 w-5" /></span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2"><LineChart title="Exam activity" description="Completed student attempts over the last six months." data={analytics.examActivity} /></div>
            <DonutChart title="School status" description={`${analytics.overview.pendingSchools} awaiting approval`} data={analytics.schoolStatus} />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <LineChart title="New schools" description="Schools added to the platform over the last six months." data={analytics.schoolGrowth} />
            <DonutChart title="Exam workflow" description={`${analytics.overview.conductedExams} exams have been taken`} data={analytics.examStatuses} />
            <HorizontalBarChart title="Most active schools" description="Ranked by completed examination attempts." data={analytics.topSchools.map((school) => ({ name: school.name, value: school.attempts }))} />
          </div>

          <section className="overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <div className="border-b border-border px-5 py-4"><h2 className="font-semibold text-text-primary">School activity breakdown</h2></div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-background"><tr>{['School', 'Students', 'Teachers', 'Exams', 'Attempts'].map((heading) => <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">{heading}</th>)}</tr></thead>
                <tbody className="divide-y divide-border">
                  {analytics.topSchools.map((school) => (
                    <tr key={school.id} className="hover:bg-background/70">
                      <td className="px-5 py-4 font-medium text-text-primary">{school.name}</td>
                      <td className="px-5 py-4 text-sm text-text-secondary">{school.students}</td>
                      <td className="px-5 py-4 text-sm text-text-secondary">{school.teachers}</td>
                      <td className="px-5 py-4 text-sm text-text-secondary">{school.exams}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-brand-indigo">{school.attempts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
