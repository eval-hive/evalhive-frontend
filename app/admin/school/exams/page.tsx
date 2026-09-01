'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, BookOpen, Filter, Trash2, BarChart3, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ExamStatusBadge from '@/components/ExamStatusBadge';
import api from '@/lib/api';

const navItems = [
  { name: 'School Dashboard', href: '/admin/school', icon: BookOpen },
  { name: 'Subjects', href: '/admin/school/subjects', icon: BookOpen },
  { name: 'Exams', href: '/admin/school/exams', icon: BookOpen },
];

interface Exam {
  id: string;
  title: string;
  examType: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  resultVisibility: 'hidden' | 'score_only' | 'full_breakdown';
  scheduledDate: string | null;
  subject: { name: string };
  classLevel: { name: string } | null;
  createdByTeacher: { firstName: string; lastName: string } | null;
  _count: { questions: number; attempts: number };
}

const formatExamScope = (exam: Exam) => {
  if (exam.classLevel?.name) return exam.classLevel.name;
  if (exam.examType === 'jamb_mock') return 'JAMB Mock Bank';
  if (exam.examType === 'waec_mock') return 'WAEC Mock Bank';
  return 'All students';
};

export default function ExamsListPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [visibilityLoadingId, setVisibilityLoadingId] = useState<string | null>(null);

  useEffect(() => { loadExams(); }, [statusFilter]);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/exams', { params });
      setExams(res.data.exams);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Could not load exams');
    } finally { setLoading(false); }
  };

  const deleteExam = async (exam: Exam) => {
    if (!window.confirm(`Delete "${exam.title}"? This cannot be undone.`)) return;

    setError('');
    setMessage('');
    try {
      await api.delete(`/exams/${exam.id}`);
      setMessage('Exam deleted.');
      loadExams();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Could not delete exam');
    }
  };

  const updateResultVisibility = async (exam: Exam, resultVisibility: Exam['resultVisibility']) => {
    setError('');
    setMessage('');
    setVisibilityLoadingId(exam.id);

    try {
      const res = await api.post(`/results/exams/${exam.id}/publish-results`, { resultVisibility });
      setExams((current) => current.map((item) => item.id === exam.id ? { ...item, resultVisibility: res.data.exam.resultVisibility } : item));
      setMessage(resultVisibility === 'hidden' ? 'Student result access has been hidden.' : 'Student result access has been updated.');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Could not update result visibility');
    } finally {
      setVisibilityLoadingId(null);
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Exams" role="School Admin">
      {message && <div className="mb-4 rounded-lg border border-brand-emerald/30 bg-brand-emerald/10 p-3 text-sm text-brand-emerald">{message}</div>}
      {error && <div className="mb-4 rounded-lg border border-brand-red/30 bg-brand-red/10 p-3 text-sm text-brand-red">{error}</div>}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-text-secondary" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-border rounded-lg text-sm bg-background">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button onClick={() => router.push('/admin/school/exams/create')}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand-indigo hover:bg-brand-indigo/90 transition-colors shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <Plus className="h-4 w-4 mr-2" /> Create Exam
        </button>
      </div>

      {/* Exam Table */}
      <div className="bg-card rounded-lg border border-border shadow-[0_1px_2px_rgba(17,24,39,0.04)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-secondary text-sm">Loading exams...</div>
        ) : exams.length === 0 ? (
          <div className="p-12 text-center text-text-secondary text-sm">No exams found. Create your first exam.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Questions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Student Results</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">{exam.title}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{exam.subject.name}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{formatExamScope(exam)}</td>
                    <td className="px-6 py-4"><ExamStatusBadge status={exam.status} /></td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{exam._count.questions}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={exam.resultVisibility}
                          onChange={(event) => updateResultVisibility(exam, event.target.value as Exam['resultVisibility'])}
                          disabled={visibilityLoadingId === exam.id || exam.examType !== 'internal'}
                          className="min-w-36 rounded-lg border border-border bg-background px-2.5 py-2 text-xs font-semibold text-text-primary outline-none focus:border-brand-indigo disabled:cursor-not-allowed disabled:opacity-60"
                          title={exam.examType !== 'internal' ? 'Mock exams always show full breakdown' : 'Control what students can see'}
                        >
                          <option value="hidden">Hidden</option>
                          <option value="score_only">Score Only</option>
                          <option value="full_breakdown">Full Breakdown</option>
                        </select>
                        {visibilityLoadingId === exam.id && <Loader2 className="h-4 w-4 animate-spin text-brand-indigo" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {exam.createdByTeacher ? `${exam.createdByTeacher.firstName} ${exam.createdByTeacher.lastName}` : 'Admin'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {exam.scheduledDate ? new Date(exam.scheduledDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => router.push(`/admin/school/exams/${exam.id}`)}
                          className="p-1.5 rounded-md text-text-secondary hover:text-brand-indigo hover:bg-brand-indigo/10 transition-colors"
                          title="View exam">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => router.push(`/admin/school/results/exam/${exam.id}`)}
                          className="p-1.5 rounded-md text-text-secondary hover:text-brand-indigo hover:bg-brand-indigo/10 transition-colors"
                          title="View results">
                          <BarChart3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteExam(exam)}
                          className="p-1.5 rounded-md text-text-secondary hover:text-brand-red hover:bg-brand-red/10 transition-colors"
                          title="Delete exam">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
