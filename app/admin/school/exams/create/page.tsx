'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';

const navItems = [
  { name: 'School Dashboard', href: '/admin/school', icon: BookOpen },
  { name: 'Subjects', href: '/admin/school/subjects', icon: BookOpen },
  { name: 'Exams', href: '/admin/school/exams', icon: BookOpen },
];

export default function CreateExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: '', subjectId: '', classLevelId: '', sessionId: '', termId: '',
    examType: 'internal', scheduledDate: '', startTime: '', endTime: '',
    durationMinutes: '60', negativeMarking: false, resultVisibility: 'hidden', optionsCount: 4, responseMode: 'multiple_choice',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [subRes, clRes, sesRes] = await Promise.all([
          api.get('/subjects'), api.get('/sessions/class-levels'), api.get('/sessions'),
        ]);
        setSubjects(subRes.data.subjects || []);
        setClassLevels(clRes.data.classLevels || []);
        setSessions(sesRes.data.sessions || []);
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  // Load terms when session changes
  useEffect(() => {
    if (form.sessionId) {
      api.get(`/sessions/${form.sessionId}/terms`).then(r => setTerms(r.data.terms || [])).catch(console.error);
    } else {
      setTerms([]);
    }
  }, [form.sessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/exams', {
        ...form,
        durationMinutes: parseInt(form.durationMinutes),
      });
      router.push(`/admin/school/exams/${res.data.exam.id}/questions`);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: any) => setForm({ ...form, [field]: value });
  const isMock = form.examType !== 'internal';
  const isJambMock = form.examType === 'jamb_mock';

  return (
    <DashboardLayout navItems={navItems} title="Create Exam" role="School Admin">
      <form onSubmit={handleSubmit} className="max-w-3xl">
        {error && (
          <div className="mb-4 bg-brand-red/10 border-l-4 border-brand-red p-3 rounded-md text-sm text-brand-red">{error}</div>
        )}

        <div className="bg-card rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)] space-y-5">
          <h2 className="text-lg font-semibold text-text-primary">Exam Details</h2>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Exam Type</label>
            <select value={form.examType} onChange={(e) => update('examType', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
              <option value="internal">Internal Class Exam</option>
              <option value="jamb_mock">JAMB Mock Question Bank</option>
              <option value="waec_mock">WAEC Mock Paper</option>
            </select>
          </div>

          {form.examType !== 'jamb_mock' && <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Response Mode</label>
            <select value={form.responseMode} onChange={(e) => update('responseMode', e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
              <option value="multiple_choice">Multiple Choice</option>
              <option value="theory" disabled>Theory (Free Response) - coming later</option>
              <option value="hybrid" disabled>Hybrid - coming later</option>
            </select>
            <p className="mt-1 text-xs text-text-secondary">JAMB is always multiple choice. Theory and Hybrid are reserved in the database for a later release.</p>
          </div>}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
            <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)} required
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-indigo bg-background" placeholder="e.g. Mid-Term Mathematics Test" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">{isJambMock ? 'Question Bank Subject' : 'Subject'}</label>
              <select value={form.subjectId} onChange={(e) => update('subjectId', e.target.value)} required
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {!isMock && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Class Level</label>
                  <select value={form.classLevelId} onChange={(e) => update('classLevelId', e.target.value)} required
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                    <option value="">Select Class</option>
                    {classLevels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Session</label>
                  <select value={form.sessionId} onChange={(e) => update('sessionId', e.target.value)} required
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                    <option value="">Select Session</option>
                    {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Term</label>
                  <select value={form.termId} onChange={(e) => update('termId', e.target.value)} required
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                    <option value="">Select Term</option>
                    {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Result Visibility</label>
              <select value={form.resultVisibility} onChange={(e) => update('resultVisibility', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                <option value="hidden">Hidden</option>
                <option value="score_only">Score Only</option>
                <option value="full_breakdown">Full Breakdown</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Options per Question</label>
              <select value={form.optionsCount} onChange={(e) => update('optionsCount', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                <option value={4}>4 Options (A-D)</option>
                <option value={5}>5 Options (A-E)</option>
              </select>
            </div>
          </div>

          {isJambMock && (
            <div className="rounded-lg border border-brand-indigo/20 bg-brand-indigo/5 p-4 text-sm text-text-secondary">
              Students choose their JAMB subject combination on the JAMB Mock page. Create one approved question bank per subject here; English must exist for students to start a JAMB mock.
            </div>
          )}

          <h3 className="text-md font-semibold text-text-primary pt-2">{isMock ? 'Timing' : 'Scheduling'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!isMock && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Date</label>
                <input type="date" value={form.scheduledDate} onChange={(e) => update('scheduledDate', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Duration (minutes)</label>
              <input type="number" value={form.durationMinutes} onChange={(e) => update('durationMinutes', e.target.value)} min="1"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
            </div>
            {!isMock && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Start Time</label>
                  <input type="time" value={form.startTime} onChange={(e) => update('startTime', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">End Time</label>
                  <input type="time" value={form.endTime} onChange={(e) => update('endTime', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="negativeMarking" checked={form.negativeMarking}
              onChange={(e) => update('negativeMarking', e.target.checked)}
              className="h-4 w-4 rounded border-border text-brand-indigo focus:ring-brand-indigo" />
            <label htmlFor="negativeMarking" className="text-sm text-text-primary">Enable negative marking</label>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={loading}
            className="inline-flex items-center px-6 py-2.5 text-sm font-medium rounded-lg text-white bg-brand-indigo hover:bg-brand-indigo/90 transition-colors disabled:opacity-70 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            {loading ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />Creating...</> : 'Create & Add Questions'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 text-sm font-medium rounded-lg text-text-secondary border border-border hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
