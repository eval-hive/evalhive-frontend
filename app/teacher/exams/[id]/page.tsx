'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen, FileText, ArrowLeft, Send, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ExamStatusBadge from '@/components/ExamStatusBadge';
import QuestionCard from '@/components/QuestionCard';
import api from '@/lib/api';

const navItems = [
  { name: 'Dashboard', href: '/teacher/dashboard', icon: BookOpen },
  { name: 'My Exams', href: '/teacher/exams', icon: FileText },
];

export default function TeacherExamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
   const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => { loadExam(); }, [id]);

  const loadExam = async () => {
    try {
      const res = await api.get(`/exams/${id}`);
      setExam(res.data.exam);
      setFormData({
        title: res.data.exam.title,
        examType: res.data.exam.examType,
        negativeMarking: res.data.exam.negativeMarking,
        resultVisibility: res.data.exam.resultVisibility,
        scheduledDate: res.data.exam.scheduledDate ? new Date(res.data.exam.scheduledDate).toISOString().split('T')[0] : '',
        startTime: res.data.exam.startTime || '',
        endTime: res.data.exam.endTime || '',
        durationMinutes: res.data.exam.durationMinutes?.toString() || '60',
        optionsCount: res.data.exam.optionsCount || 4,
        subjectId: res.data.exam.subjectId,
        classLevelId: res.data.exam.classLevelId,
        sessionId: res.data.exam.sessionId,
        termId: res.data.exam.termId,
      });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  
  const handleUpdate = async () => {
    setError(''); setActionLoading(true);
    try {
      await api.put(`/exams/${id}`, {
        ...formData,
        durationMinutes: parseInt(formData.durationMinutes),
      });
      setIsEditing(false);
      loadExam();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to update exam');
    } finally { setActionLoading(false); }
  };

  const submitForApproval = async () => {
    setError(''); setActionLoading(true);
    try {
      await api.post(`/exams/${id}/submit`);
      loadExam();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to submit');
    } finally { setActionLoading(false); }
  };

  if (loading || !exam) {
    return <DashboardLayout navItems={navItems} title="Exam Detail" role="Teacher">
      <div className="text-center py-12 text-text-secondary text-sm">Loading...</div>
    </DashboardLayout>;
  }

  return (
    <DashboardLayout navItems={navItems} title="Exam Detail" role="Teacher">
      <button onClick={() => router.push('/teacher/exams')}
        className="inline-flex items-center text-sm text-text-secondary hover:text-brand-indigo mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to My Exams
      </button>

      {error && (
        <div className="mb-4 bg-brand-red/10 border-l-4 border-brand-red p-3 rounded-md text-sm text-brand-red">{error}</div>
      )}

      {/* Rejection Banner */}
      {exam.status === 'rejected' && exam.rejectionReason && (
        <div className="mb-4 bg-brand-red/5 border border-brand-red/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-brand-red flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-brand-red">This exam was rejected</p>
            <p className="text-sm text-text-primary mt-1">{exam.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Exam Info Card */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-text-primary">{exam.title}</h2>
              {['draft', 'rejected'].includes(exam.status) && (
                <button onClick={() => setIsEditing(!isEditing)} className="text-xs text-brand-indigo hover:underline">
                  {isEditing ? 'Cancel Edit' : 'Edit Settings'}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <ExamStatusBadge status={exam.status} />
              <span className="text-xs text-text-secondary">{exam.examType?.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push(`/teacher/exams/${id}/questions`)}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-brand-indigo bg-brand-indigo/10 hover:bg-brand-indigo/20 transition-colors">
              Manage Questions ({exam.questions?.length || 0})
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="mt-5 space-y-4 border-t border-border pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Exam Title</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Options per Question</label>
                <select value={formData.optionsCount} onChange={(e) => setFormData({...formData, optionsCount: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                  <option value={4}>4 Options (A-D)</option>
                  <option value={5}>5 Options (A-E)</option>
                </select>
              </div>
            </div>
            <button onClick={handleUpdate} disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand-indigo hover:bg-brand-indigo/90 transition-colors">
              Save Changes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-sm">
            <div><span className="text-text-secondary block">Subject</span><span className="font-medium text-text-primary">{exam.subject?.name}</span></div>
            <div><span className="text-text-secondary block">Class</span><span className="font-medium text-text-primary">{exam.classLevel?.name}</span></div>
            <div><span className="text-text-secondary block">Session</span><span className="font-medium text-text-primary">{exam.session?.name}</span></div>
            <div><span className="text-text-secondary block">Term</span><span className="font-medium text-text-primary">{exam.term?.name}</span></div>
            <div><span className="text-text-secondary block">Date</span><span className="font-medium text-text-primary">{exam.scheduledDate ? new Date(exam.scheduledDate).toLocaleDateString() : '—'}</span></div>
            <div><span className="text-text-secondary block">Duration</span><span className="font-medium text-text-primary">{exam.durationMinutes ? `${exam.durationMinutes} min` : '—'}</span></div>
            <div><span className="text-text-secondary block">Options/Question</span><span className="font-medium text-text-primary">{exam.optionsCount || 4}</span></div>
          </div>
        )}

        {/* Submit for Approval */}
        {['draft', 'rejected'].includes(exam.status) && (
          <div className="mt-5 pt-4 border-t border-border">
            <button onClick={submitForApproval} disabled={actionLoading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand-emerald hover:bg-brand-emerald/90 transition-colors disabled:opacity-70">
              <Send className="h-4 w-4 mr-2" /> Submit for Approval
            </button>
          </div>
        )}
      </div>

      {/* Questions Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Questions ({exam.questions?.length || 0})</h3>
        {exam.questions?.length === 0 ? (
          <div className="text-center py-8 text-text-secondary text-sm bg-card rounded-xl border border-border">No questions added yet.</div>
        ) : (
          exam.questions.map((q: any, i: number) => (
            <QuestionCard key={q.id} index={i} question={q} readonly />
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
