'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen, CheckCircle, XCircle, ArrowLeft, Edit, Users } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ExamStatusBadge from '@/components/ExamStatusBadge';
import QuestionCard from '@/components/QuestionCard';
import api from '@/lib/api';

const navItems = [
  { name: 'School Dashboard', href: '/admin/school', icon: BookOpen },
  { name: 'Subjects', href: '/admin/school/subjects', icon: BookOpen },
  { name: 'Exams', href: '/admin/school/exams', icon: BookOpen },
];

export default function ExamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
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
    setError(''); setActionLoading(true);
    try {
      if (!isMock && (!formData.subjectId || !formData.classLevelId || !formData.sessionId || !formData.termId)) {
        setError('Subject, class level, session, and term are required for internal exams.');
        setActionLoading(false);
        return;
      }

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

  const approve = async () => {
    setActionLoading(true); setError('');
    try {
      await api.post(`/exams/${id}/approve`);
      loadExam();
    } catch (e: any) { setError(e.response?.data?.error || 'Failed'); } finally { setActionLoading(false); }
  };

  const reject = async () => {
    if (!rejectReason.trim()) { setError('Rejection reason is required'); return; }
    setActionLoading(true); setError('');
    try {
      await api.post(`/exams/${id}/reject`, { reason: rejectReason });
      setShowReject(false); setRejectReason(''); loadExam();
    } catch (e: any) { setError(e.response?.data?.error || 'Failed'); } finally { setActionLoading(false); }
  };

  const reassign = async () => {
    if (!selectedTeacher) { setError('Please select a teacher'); return; }
    setActionLoading(true); setError('');
    try {
      await api.post(`/exams/${id}/reassign`, { teacherId: selectedTeacher });
      setShowReassign(false); loadExam();
    } catch (e: any) { setError(e.response?.data?.error || 'Failed'); } finally { setActionLoading(false); }
  };

  const openReassign = async () => {
    try {
      const res = await api.get('/teachers');
      setTeachers(res.data.teachers || []);
      setShowReassign(true);
    } catch (e) { console.error(e); }
  };
  const isMock = exam?.examType !== 'internal';

  if (loading || !exam) {
    return <DashboardLayout navItems={navItems} title="Exam Detail" role="School Admin">
      <div className="text-center py-12 text-text-secondary text-sm">Loading...</div>
    </DashboardLayout>;
  }

  return (
    <DashboardLayout navItems={navItems} title="Exam Detail" role="School Admin">
      <button onClick={() => router.push('/admin/school/exams')}
        className="inline-flex items-center text-sm text-text-secondary hover:text-brand-indigo mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Exams
      </button>

      {error && (
        <div className="mb-4 bg-brand-red/10 border-l-4 border-brand-red p-3 rounded-md text-sm text-brand-red">{error}</div>
      )}

      {/* Rejection Banner */}
      {exam.status === 'rejected' && exam.rejectionReason && (
        <div className="mb-4 bg-brand-red/5 border border-brand-red/30 rounded-lg p-4">
          <p className="text-sm font-medium text-brand-red">Rejection Reason:</p>
          <p className="text-sm text-text-primary mt-1">{exam.rejectionReason}</p>
        </div>
      )}

      {/* Exam Info Card */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)] mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-text-primary">{exam.title}</h2>
              <button onClick={() => setIsEditing(!isEditing)} className="text-xs text-white bg-accent p-1 cursor-pointer hover:bg-accent/90 rounded transition-colors">
                {isEditing ? 'Cancel Edit' : 'Edit Settings'}
              </button>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <ExamStatusBadge status={exam.status} />
              <span className="text-xs text-text-secondary">{exam.examType.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push(`/admin/school/exams/${id}/questions`)}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-brand-indigo bg-brand-indigo/10 hover:bg-brand-indigo/20 transition-colors">
              <Edit className="h-3.5 w-3.5 mr-1" /> Manage Questions ({exam.questions?.length || 0})
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
                  Mock question banks do not use exam dates or start/end times. Students can take JAMB and WAEC mocks anytime while mock availability is enabled on the School Dashboard.
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
          </div>
        )}

        {/* Teacher Info */}
        {exam.createdByTeacher && (
          <div className="mt-4 pt-4 border-t border-border text-sm">
            <span className="text-text-secondary">Created by: </span>
            <span className="font-medium text-text-primary">{exam.createdByTeacher.firstName} {exam.createdByTeacher.lastName}</span>
          </div>
        )}

        {/* Action Buttons */}
        {exam.status === 'pending' && (
          <div className="mt-5 pt-4 border-t border-border flex gap-3">
            <button onClick={approve} disabled={actionLoading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand-emerald hover:bg-brand-emerald/90 transition-colors disabled:opacity-70">
              <CheckCircle className="h-4 w-4 mr-2" /> Approve
            </button>
            <button onClick={() => setShowReject(true)} disabled={actionLoading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand-red hover:bg-brand-red/90 transition-colors disabled:opacity-70">
              <XCircle className="h-4 w-4 mr-2" /> Reject
            </button>
            <button onClick={openReassign} disabled={actionLoading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-text-primary border border-border hover:bg-gray-50 transition-colors">
              <Users className="h-4 w-4 mr-2" /> Reassign
            </button>
          </div>
        )}
      </div>

      {/* Rejection Reason Modal */}
      {showReject && (
        <div className="bg-card rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)] mb-6">
          <h3 className="text-md font-semibold text-text-primary mb-3">Rejection Reason</h3>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background resize-none" placeholder="Explain why this exam is being rejected..." />
          <div className="mt-3 flex gap-2">
            <button onClick={reject} className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand-red hover:bg-brand-red/90 transition-colors">Confirm Reject</button>
            <button onClick={() => setShowReject(false)} className="px-4 py-2 text-sm font-medium rounded-lg text-text-secondary border border-border">Cancel</button>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {showReassign && (
        <div className="bg-card rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)] mb-6">
          <h3 className="text-md font-semibold text-text-primary mb-3">Reassign to Teacher</h3>
          <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
            <option value="">Select Teacher</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
          </select>
          <div className="mt-3 flex gap-2">
            <button onClick={reassign} className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand-indigo hover:bg-brand-indigo/90 transition-colors">Reassign</button>
            <button onClick={() => setShowReassign(false)} className="px-4 py-2 text-sm font-medium rounded-lg text-text-secondary border border-border">Cancel</button>
          </div>
        </div>
      )}

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
