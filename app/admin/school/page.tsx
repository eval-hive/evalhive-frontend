'use client';

import { useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, BookOpen, Building2, CheckCircle2, ClipboardCheck, FileSpreadsheet, GraduationCap, Loader2, UploadCloud, Users } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { DonutChart, HorizontalBarChart, LineChart } from '@/components/AnalyticsCharts';
import api from '@/lib/api';
import { AnalyticsPresentation, AnimatedMetric, AnalyticsProgress } from '@/components/AnalyticsPresentation';

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

const loadOverview = () => Promise.all([api.get('/schools/analytics'), api.get('/schools/mock-settings')]);

export default function SchoolAdminDashboard() {
  const router = useRouter();
  const { wrap } = useContext(AnalyticsPresentation);
  const [analytics, setAnalytics] = useState<SchoolAnalytics | null>(null);
  const [mockSettings, setMockSettings] = useState({ jambMockEnabled: true, waecMockEnabled: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const initialLoad = useRef<ReturnType<typeof loadOverview> | null>(null);

  useEffect(() => {
    let active = true;
    // Reuse this mount's request during Strict Mode's effect replay.
    // An abandoned effect must not leave an error over a successful response.
    const pending = initialLoad.current ??= loadOverview();
    pending
      .then(([analyticsResponse, settingsResponse]) => {
        if (!active) return;
        setAnalytics(analyticsResponse.data.analytics);
        setMockSettings(settingsResponse.data.settings);
        setError('');
      })
      .catch((err) => { if (active) setError(err.response?.data?.error || 'Unable to load school analytics.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
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
    { label: 'Average Score', value: analytics.overview.averageScore, suffix: '%', icon: BarChart3 },
    { label: 'Exams Set', value: analytics.overview.totalExams, icon: ClipboardCheck },
    { label: 'Completed Attempts', value: analytics.overview.completedAttempts, icon: CheckCircle2 },
    { label: 'Results Published', value: analytics.overview.publishedResults, icon: FileSpreadsheet },
  ] : [];

  return (
    <DashboardLayout navItems={navItems} title="School Overview" role="School Admin">
      {wrap("analytics-heading", <div className="mb-7">
        <h1 className="text-2xl font-bold text-text-primary">Student performance overview</h1>
        <p className="mt-1 text-sm text-text-secondary">Track examination participation and academic performance across your school.</p>
      </div>)}

      {loading && wrap("analytics-loading", <div className="flex min-h-80 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-indigo" /></div>)}
      {error && wrap("analytics-error", <div className="mb-6 rounded-lg border border-brand-red/20 bg-brand-red/5 p-4 text-sm text-brand-red">{error}</div>)}

      {analytics && (
        <div className="analytics-stack space-y-6">
          <div className="analytics-stats grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {stats.map(({ label, value, suffix, icon: Icon }, index) => wrap(`stat-${index}`, (
              <div key={label} className="rounded-lg border border-border bg-card p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-sm text-text-secondary">{label}</p><p className="mt-2 text-3xl font-bold text-text-primary"><AnimatedMetric id={`stat-${index}`} value={value} suffix={suffix} /></p></div>
                  <span className="rounded-lg bg-brand-indigo/10 p-2.5 text-brand-indigo"><Icon className="h-5 w-5" /></span>
                </div>
              </div>
            )))}
          </div>

          <div className="analytics-chart-row grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="analytics-wide xl:col-span-2">{wrap("trend", <AnalyticsProgress id="trend">{progress => <LineChart progress={progress} title="Performance trend" description="Average scores from completed attempts over the last six months." data={analytics.performanceTrend} valueKey="average" suffix="%" />}</AnalyticsProgress>)}</div>
            {wrap("distribution", <AnalyticsProgress id="distribution">{progress => <DonutChart progress={progress} title="Score distribution" description="How completed attempts are distributed by score band." data={analytics.scoreDistribution} />}</AnalyticsProgress>)}
          </div>

          <div className="analytics-bars grid grid-cols-1 gap-6 xl:grid-cols-2">
            {wrap("subjects", <AnalyticsProgress id="subjects">{progress => <HorizontalBarChart progress={progress} title="Subject performance" description="Average score by subject." data={analytics.subjectPerformance} valueKey="average" suffix="%" />}</AnalyticsProgress>)}
            {wrap("classes", <AnalyticsProgress id="classes">{progress => <HorizontalBarChart progress={progress} title="Class performance" description="Average score by class level." data={analytics.classPerformance} valueKey="average" suffix="%" />}</AnalyticsProgress>)}
          </div>

          <div className="analytics-chart-row grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="analytics-wide xl:col-span-2">{wrap("exam-list", <section className="overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
              <div className="border-b border-border px-5 py-4"><h2 className="font-semibold text-text-primary">Exam performance</h2><p className="mt-1 text-sm text-text-secondary">The exams with the most completed attempts.</p></div>
              <div className="divide-y divide-border">
                {analytics.recentExamPerformance.length ? analytics.recentExamPerformance.map((exam) => (
                  <button key={exam.id} onClick={() => router.push(`/admin/school/exams/${exam.id}`)} className="flex w-full items-center justify-between gap-5 px-5 py-4 text-left hover:bg-background">
                    <div className="min-w-0"><p className="truncate font-medium text-text-primary">{exam.title}</p><p className="mt-1 text-xs text-text-secondary"><AnimatedMetric id="exam-list" value={exam.attempts} /> completed attempt{exam.attempts === 1 ? '' : 's'}</p></div>
                    <span className="shrink-0 text-lg font-bold text-brand-indigo"><AnimatedMetric id="exam-list" value={exam.average} suffix="%" /></span>
                  </button>
                )) : <div className="p-10 text-center text-sm text-text-secondary">Completed exam results will appear here.</div>}
              </div>
            </section>)}</div>
            {wrap("workflow", <AnalyticsProgress id="workflow">{progress => <DonutChart progress={progress} title="Exam workflow" description={`${analytics.overview.pendingExams} exams awaiting review`} data={analytics.examStatuses} />}</AnalyticsProgress>)}
          </div>

          {wrap("mock-settings", <section>
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
          </section>)}
        </div>
      )}
    </DashboardLayout>
  );
}
