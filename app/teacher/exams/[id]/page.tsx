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
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  useEffect(() => { loadExam(); }, [id]);
  useEffect(() => { loadFormOptions(); }, []);
  useEffect(() => {
    if (formData?.sessionId) {
      api.get(`/sessions/${formData.sessionId}/terms`)
        .then(r => setTerms(r.data.terms || []))
        .catch(() => setTerms([]));
    } else {
      setTerms([]);
    }
  }, [formData?.sessionId]);

  const loadExam = async () => {
    try {
      const res = await api.get(`/exams/${id}`);
      setExam(res.data.exam);
      setFormData({
        title: res.data.exam.title,
        examType: res.data.exam.examType,
        negativeMarking: res.data.exam.negativeMarking,
        resultVisibility: res.data.exam.resultVisibility,
        scheduledDate: res.data.exam.scheduledDate ? String(res.data.exam.scheduledDate).slice(0, 10) : '',
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

  const loadFormOptions = async () => {
    try {
      const [subRes, clRes, sesRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/sessions/class-levels'),
        api.get('/sessions'),
      ]);
      setSubjects(subRes.data.subjects || []);
      setClassLevels(clRes.data.classLevels || []);
      setSessions(sesRes.data.sessions || []);
    } catch {
      setError('Could not load exam setting options.');
    }
  };

  const updateForm = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
      ...(field === 'sessionId' ? { termId: '' } : {}),
    }));
  };
  
  const handleUpdate = async () => {
    setError(''); setMessage(''); setActionLoading(true);
    try {
      if (!isMock && (!formData.subjectId || !formData.classLevelId || !formData.sessionId || !formData.termId)) {
        setError('Subject, class level, session, and term are required for internal exams.');
        setActionLoading(false);
        return;
      }

      const response = await api.put(`/exams/${id}`, {
        ...formData,
        scheduledDate: formData.scheduledDate ? `${formData.scheduledDate}T00:00:00.000Z` : null,
        durationMinutes: parseInt(formData.durationMinutes),
      });
      setExam(response.data.exam);
      setFormData((current: any) => ({
        ...current,
        scheduledDate: response.data.exam.scheduledDate ? String(response.data.exam.scheduledDate).slice(0, 10) : '',
      }));
      setIsEditing(false);
      setMessage('Exam settings updated successfully.');
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
  const isMock = exam?.examType !== 'internal';

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
      {message && (
        <div className="mb-4 rounded-md border border-brand-emerald/30 bg-brand-emerald/10 p-3 text-sm text-brand-emerald">{message}</div>
      )}

      {/* Rejection Banner */}
      {exam.status === 'rejected' && exam.rejectionReason && (
        <div className="mb-4 bg-brand-red/5 border border-brand-red/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-brand-red flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-brand-red">This exam was rejected</p>
            <p className="text-sm text-text-primary mt-1">{exam.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Exam Info Card */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)] mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-text-primary">{exam.title}</h2>
              <button onClick={() => setIsEditing(!isEditing)} className="text-xs text-brand-indigo hover:underline">
                {isEditing ? 'Cancel Edit' : 'Edit Settings'}
              </button>
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
                <input type="text" value={formData.title} onChange={(e) => updateForm('title', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">{isMock ? 'Question Bank Subject' : 'Subject'}</label>
                <select value={formData.subjectId || ''} onChange={(e) => updateForm('subjectId', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Options per Question</label>
                <select value={formData.optionsCount} onChange={(e) => updateForm('optionsCount', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                  <option value={4}>4 Options (A-D)</option>
                  <option value={5}>5 Options (A-E)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Duration (minutes)</label>
                <input type="number" min="1" value={formData.durationMinutes} onChange={(e) => updateForm('durationMinutes', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
              </div>
              {!isMock && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Class Level</label>
                    <select value={formData.classLevelId || ''} onChange={(e) => updateForm('classLevelId', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                      <option value="">Select Class</option>
                      {classLevels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Session</label>
                    <select value={formData.sessionId || ''} onChange={(e) => updateForm('sessionId', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                      <option value="">Select Session</option>
                      {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Term</label>
                    <select value={formData.termId || ''} onChange={(e) => updateForm('termId', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                      <option value="">Select Term</option>
                      {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Date</label>
                    <input type="date" value={formData.scheduledDate} onChange={(e) => updateForm('scheduledDate', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Start Time</label>
                    <input type="time" value={formData.startTime} onChange={(e) => updateForm('startTime', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">End Time</label>
                    <input type="time" value={formData.endTime} onChange={(e) => updateForm('endTime', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Result Visibility</label>
                    <select value={formData.resultVisibility} onChange={(e) => updateForm('resultVisibility', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                      <option value="hidden">Hidden</option>
                      <option value="score_only">Score Only</option>
                      <option value="full_breakdown">Full Breakdown</option>
                    </select>
                  </div>
                </>
              )}
              {isMock && (
                <div className="sm:col-span-2 rounded-lg border border-brand-indigo/20 bg-brand-indigo/5 p-4 text-sm text-text-secondary">
                  Mock question banks do not use exam dates or start/end times. Students can take JAMB and WAEC mocks anytime while mock availability is enabled by the school admin.
                </div>
              )}
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
            <div><span className="text-text-secondary block">Time</span><span className="font-medium text-text-primary">{exam.startTime || '—'} – {exam.endTime || '—'}</span></div>
            <div><span className="text-text-secondary block">Duration</span><span className="font-medium text-text-primary">{exam.durationMinutes ? `${exam.durationMinutes} min` : '—'}</span></div>
            <div><span className="text-text-secondary block">Options/Question</span><span className="font-medium text-text-primary">{exam.optionsCount || 4}</span></div>
            <div><span className="text-text-secondary block">Result Visibility</span><span className="font-medium text-text-primary">{exam.resultVisibility?.replace('_', ' ')}</span></div>
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
          <div className="text-center py-8 text-text-secondary text-sm bg-card rounded-lg border border-border">No questions added yet.</div>
        ) : (
          exam.questions.map((q: any, i: number) => (
            <QuestionCard key={q.id} index={i} question={q} readonly />
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
