'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, BookOpen, FileText } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ExamStatusBadge from '@/components/ExamStatusBadge';
import api from '@/lib/api';

const navItems = [
  { name: 'Dashboard', href: '/teacher/dashboard', icon: BookOpen },
  { name: 'My Exams', href: '/teacher/exams', icon: FileText },
];

export default function TeacherExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadExams(); }, []);

  const loadExams = async () => {
    try {
      const res = await api.get('/exams');
      setExams(res.data.exams);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <DashboardLayout navItems={navItems} title="My Exams" role="Teacher">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-text-secondary">{exams.length} exam{exams.length !== 1 ? 's' : ''}</p>
        <button onClick={() => router.push('/teacher/exams/create')}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand-indigo hover:bg-brand-indigo/90 transition-colors shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <Plus className="h-4 w-4 mr-2" /> Create Exam
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-[0_1px_2px_rgba(17,24,39,0.04)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-secondary text-sm">Loading...</div>
        ) : exams.length === 0 ? (
          <div className="p-12 text-center text-text-secondary text-sm">No exams yet. Create your first exam.</div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">{exam.title}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{exam.subject?.name}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{exam.classLevel?.name}</td>
                    <td className="px-6 py-4"><ExamStatusBadge status={exam.status} /></td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{exam._count?.questions || 0}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {exam.scheduledDate ? new Date(exam.scheduledDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => router.push(`/teacher/exams/${exam.id}`)}
                        className="p-1.5 rounded-md text-text-secondary hover:text-brand-indigo hover:bg-brand-indigo/10 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
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
