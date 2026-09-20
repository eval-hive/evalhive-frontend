'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, BookOpen, Building2, CheckCircle2, ClipboardCheck, FileSpreadsheet, GraduationCap, Loader2, UploadCloud, Users } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { DonutChart, HorizontalBarChart, LineChart } from '@/components/AnalyticsCharts';
import api from '@/lib/api';

const navItems = [
  { name: 'School Dashboard', href: '/admin/school', icon: Building2 },
  { name: 'Subjects', href: '/admin/school/subjects', icon: BookOpen },
  { name: 'Teachers', href: '/admin/school/teachers', icon: Users },
  { name: 'Students', href: '/admin/school/students', icon: GraduationCap },
  { name: 'Exams', href: '/admin/school/exams', icon: FileSpreadsheet },
  { name: 'Import Questions', href: '/admin/school/import', icon: UploadCloud },
  { name: 'Results', href: '/admin/school/results', icon: BarChart3 },
];

interface SchoolAnalytics {
  overview: { activeStudents: number; activeTeachers: number; totalExams: number; completedAttempts: number; averageScore: number; pendingExams: number; publishedResults: number };
  performanceTrend: { label: string; average: number; attempts: number }[];
  subjectPerformance: { name: string; average: number; attempts: number }[];
  classPerformance: { name: string; average: number; attempts: number }[];
  scoreDistribution: { name: string; value: number }[];
  examStatuses: { name: string; value: number }[];
  recentExamPerformance: { id: string; title: string; average: number; attempts: number }[];
}

export default function SchoolAdminDashboard() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<SchoolAnalytics | null>(null);
  const [mockSettings, setMockSettings] = useState({ jambMockEnabled: true, waecMockEnabled: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/schools/analytics'), api.get('/schools/mock-settings')])
      .then(([analyticsResponse, settingsResponse]) => {
        setAnalytics(analyticsResponse.data.analytics);
        setMockSettings(settingsResponse.data.settings);
      })
      .catch((err) => setError(err.response?.data?.error || 'Unable to load school analytics.'))
      .finally(() => setLoading(false));
  }, []);

  const updateMockSetting = async (field: 'jambMockEnabled' | 'waecMockEnabled', value: boolean) => {
    const previous = mockSettings;
    setMockSettings({ ...previous, [field]: value });
    try {
      const response = await api.put('/schools/mock-settings', { [field]: value });
      setMockSettings(response.data.settings);
    } catch (err) {
      setMockSettings(previous);
      setError('The mock exam setting could not be updated.');
    }
  };

  const stats = analytics ? [
    { label: 'Active Students', value: analytics.overview.activeStudents, icon: GraduationCap },
    { label: 'Active Teachers', value: analytics.overview.activeTeachers, icon: Users },
    { label: 'Average Score', value: `${analytics.overview.averageScore}%`, icon: BarChart3 },
    { label: 'Exams Set', value: analytics.overview.totalExams, icon: ClipboardCheck },
    { label: 'Completed Attempts', value: analytics.overview.completedAttempts, icon: CheckCircle2 },
    { label: 'Results Published', value: analytics.overview.publishedResults, icon: FileSpreadsheet },
  ] : [];

  return (
    <DashboardLayout navItems={navItems} title="School Overview" role="School Admin">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-text-primary">Student performance overview</h1>
        <p className="mt-1 text-sm text-text-secondary">Track examination participation and academic performance across your school.</p>
      </div>

      {loading && <div className="flex min-h-80 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-indigo" /></div>}
      {error && <div className="mb-6 rounded-lg border border-brand-red/20 bg-brand-red/5 p-4 text-sm text-brand-red">{error}</div>}

      {analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg border border-border bg-card p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-sm text-text-secondary">{label}</p><p className="mt-2 text-3xl font-bold text-text-primary">{typeof value === 'number' ? value.toLocaleString() : value}</p></div>
                  <span className="rounded-lg bg-brand-indigo/10 p-2.5 text-brand-indigo"><Icon className="h-5 w-5" /></span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2"><LineChart title="Performance trend" description="Average scores from completed attempts over the last six months." data={analytics.performanceTrend} valueKey="average" suffix="%" /></div>
            <DonutChart title="Score distribution" description="How completed attempts are distributed by score band." data={analytics.scoreDistribution} />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <HorizontalBarChart title="Subject performance" description="Average score by subject." data={analytics.subjectPerformance} valueKey="average" suffix="%" />
            <HorizontalBarChart title="Class performance" description="Average score by class level." data={analytics.classPerformance} valueKey="average" suffix="%" />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <section className="overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(17,24,39,0.04)] xl:col-span-2">
              <div className="border-b border-border px-5 py-4"><h2 className="font-semibold text-text-primary">Exam performance</h2><p className="mt-1 text-sm text-text-secondary">The exams with the most completed attempts.</p></div>
              <div className="divide-y divide-border">
                {analytics.recentExamPerformance.length ? analytics.recentExamPerformance.map((exam) => (
                  <button key={exam.id} onClick={() => router.push(`/admin/school/exams/${exam.id}`)} className="flex w-full items-center justify-between gap-5 px-5 py-4 text-left hover:bg-background">
                    <div className="min-w-0"><p className="truncate font-medium text-text-primary">{exam.title}</p><p className="mt-1 text-xs text-text-secondary">{exam.attempts} completed attempt{exam.attempts === 1 ? '' : 's'}</p></div>
                    <span className="shrink-0 text-lg font-bold text-brand-indigo">{exam.average}%</span>
                  </button>
                )) : <div className="p-10 text-center text-sm text-text-secondary">Completed exam results will appear here.</div>}
              </div>
            </section>
            <DonutChart title="Exam workflow" description={`${analytics.overview.pendingExams} exams awaiting review`} data={analytics.examStatuses} />
          </div>

          <section>
            <div className="mb-4"><h2 className="text-lg font-semibold text-text-primary">Mock exam availability</h2><p className="mt-1 text-sm text-text-secondary">Control whether students can start each mock examination.</p></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { key: 'jambMockEnabled' as const, title: 'JAMB Mock', description: 'Allow students to take JAMB mock practice anytime.' },
                { key: 'waecMockEnabled' as const, title: 'WAEC Mock', description: 'Allow students to take WAEC mock papers anytime.' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-5">
                  <div><h3 className="font-medium text-text-primary">{item.title}</h3><p className="mt-1 text-sm text-text-secondary">{item.description}</p></div>
                  <button onClick={() => updateMockSetting(item.key, !mockSettings[item.key])} className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white ${mockSettings[item.key] ? 'bg-brand-emerald' : 'bg-brand-red'}`}>{mockSettings[item.key] ? 'Enabled' : 'Disabled'}</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
