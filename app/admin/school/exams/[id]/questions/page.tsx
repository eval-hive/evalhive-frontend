'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen, Plus, ArrowLeft, Loader2, UploadCloud, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import QuestionCard from '@/components/QuestionCard';
import api from '@/lib/api';

const navItems = [
  { name: 'School Dashboard', href: '/admin/school', icon: BookOpen },
  { name: 'Subjects', href: '/admin/school/subjects', icon: BookOpen },
  { name: 'Exams', href: '/admin/school/exams', icon: BookOpen },
];

export default function ExamQuestionsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
   const [error, setError] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [exam, setExam] = useState<any>(null);
  const [entryMode, setEntryMode] = useState<'manual' | 'upload'>('manual');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [importJobId, setImportJobId] = useState('');
  const [extractedQuestions, setExtractedQuestions] = useState<any[]>([]);

  const emptyForm = { questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '', correctOption: 'a' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadQuestions(); }, [id]);

  const loadQuestions = async () => {
    try {
      const res = await api.get(`/exams/${id}`);
      setExam(res.data.exam);
      setQuestions(res.data.exam.questions || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  const addQuestion = async () => {
    setError('');
    const isFiveOptions = exam?.optionsCount === 5;
    if (!form.questionText || !form.optionA || !form.optionB || !form.optionC || !form.optionD || (isFiveOptions && !form.optionE)) {
      setError('All fields are required'); return;
    }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/questions/${editId}`, form);
        setEditId(null);
      } else {
        await api.post(`/exams/${id}/questions`, form);
      }
      setForm(emptyForm);
      loadQuestions();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  const approveExam = async () => {
    if (!confirm('Are you sure you want to publish this exam? Students will be able to see it once the window opens.')) return;
    setSaving(true);
    setError('');
    try {
      await api.post(`/exams/${id}/approve`);
      router.push(`/admin/school/exams/${id}`);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to approve exam');
      setSaving(false);
    }
  };


  const startEdit = (questionId: string) => {
    const q = questions.find(q => q.id === questionId);
    if (q) {
      setForm({
        questionText: q.questionText, optionA: q.optionA, optionB: q.optionB,
        optionC: q.optionC, optionD: q.optionD, optionE: q.optionE || '', correctOption: q.correctOption,
      });
      setEditId(questionId);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) return;
    try {
      await api.delete(`/questions/${questionId}`);
      loadQuestions();
    } catch (e) { console.error(e); }
  };

  const uploadDocument = async () => {
    if (!uploadFile) { setError('Please choose a .docx file'); return; }
    setError('');
    setSaving(true);
    try {
      const data = new FormData();
      data.append('file', uploadFile);
      const uploadRes = await api.post('/admin/import/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportJobId(uploadRes.data.jobId);
      const processRes = await api.post(`/admin/import/${uploadRes.data.jobId}/process`);
      setExtractedQuestions(processRes.data.questions || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to extract questions');
    } finally {
      setSaving(false);
    }
  };

  const updateExtractedQuestion = (idx: number, field: string, value: string) => {
    setExtractedQuestions(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const confirmDocumentImport = async () => {
    if (!importJobId || extractedQuestions.length === 0) return;
    setError('');
    setSaving(true);
    try {
      await api.post(`/admin/import/${importJobId}/confirm`, {
        examType: 'internal',
        examId: id,
        questions: extractedQuestions
      });
      setUploadFile(null);
      setImportJobId('');
      setExtractedQuestions([]);
      setEntryMode('manual');
      loadQuestions();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to import questions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Exam Questions" role="School Admin">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => router.push(`/admin/school/exams/${id}`)}
          className="inline-flex items-center text-sm text-text-secondary hover:text-brand-indigo">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Exam
        </button>

        {exam?.status === 'draft' && questions.length > 0 && (
          <button onClick={approveExam} disabled={saving}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand-emerald hover:bg-brand-emerald/90 transition-colors shadow-sm">
            Publish & Approve Exam
          </button>
        )}
      </div>

      <div className="text-sm text-text-secondary mb-4 font-medium">{questions.length} question{questions.length !== 1 ? 's' : ''}</div>

      {error && (
        <div className="mb-4 bg-brand-red/10 border-l-4 border-brand-red p-3 rounded-md text-sm text-brand-red">{error}</div>
      )}

      {/* Question List */}
      <div className="space-y-4 mb-8">
        {loading ? (
          <div className="text-center py-8 text-text-secondary text-sm">Loading...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 text-text-secondary text-sm bg-card rounded-xl border border-border">No questions yet. Add your first question below.</div>
        ) : (
          questions.map((q, i) => (
            <QuestionCard key={q.id} index={i} question={q} onEdit={startEdit} onDelete={deleteQuestion} />
          ))
        )}
      </div>

      {/* Add/Edit Question Form */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="mb-6 flex gap-2">
          <button onClick={() => setEntryMode('manual')} className={`px-4 py-2 rounded-lg text-sm font-medium ${entryMode === 'manual' ? 'bg-brand-indigo text-white' : 'border border-border text-text-secondary'}`}>
            Input Manually
          </button>
          <button onClick={() => setEntryMode('upload')} className={`px-4 py-2 rounded-lg text-sm font-medium ${entryMode === 'upload' ? 'bg-brand-indigo text-white' : 'border border-border text-text-secondary'}`}>
            Upload .docx
          </button>
        </div>

        {entryMode === 'upload' ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-background p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-2">Upload guidelines</h3>
              <div className="grid gap-4 text-xs text-text-secondary sm:grid-cols-2">
                <div>
                  <p className="font-medium text-text-primary mb-1">Do</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Upload a .docx file for this exam.</li>
                    <li>Number each question and label options A-D.</li>
                    <li>Review every extracted answer before adding questions.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-text-primary mb-1">Do not</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Upload scanned images or handwritten pages.</li>
                    <li>Mix subjects or exam sections in one file.</li>
                    <li>Leave correct answers as unknown before importing.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <UploadCloud className="w-10 h-10 text-text-secondary mx-auto mb-3" />
              <input type="file" accept=".docx" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="mx-auto text-sm" />
            </div>
            <button onClick={uploadDocument} disabled={!uploadFile || saving} className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand-indigo disabled:opacity-50">
              {saving ? 'Extracting...' : 'Extract Questions'}
            </button>

            {extractedQuestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary">Review Extracted Questions</h3>
                  <button onClick={confirmDocumentImport} disabled={saving} className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand-emerald">
                    Add {extractedQuestions.length} Questions
                  </button>
                </div>
                {extractedQuestions.map((q, idx) => (
                  <div key={idx} className="border border-border rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-brand-indigo">Q{idx + 1}</span>
                      <button onClick={() => setExtractedQuestions(prev => prev.filter((_, i) => i !== idx))} className="text-text-secondary hover:text-brand-red">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea value={q.question_text || ''} onChange={(e) => updateExtractedQuestion(idx, 'question_text', e.target.value)} rows={2} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['a', 'b', 'c', 'd'].map(opt => (
                        <input key={opt} value={q[`option_${opt}`] || ''} onChange={(e) => updateExtractedQuestion(idx, `option_${opt}`, e.target.value)} placeholder={`Option ${opt.toUpperCase()}`} className="px-3 py-2 border border-border rounded-lg text-sm bg-background" />
                      ))}
                    </div>
                    <select value={q.correct_option || ''} onChange={(e) => updateExtractedQuestion(idx, 'correct_option', e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm bg-background">
                      <option value="">Correct answer</option>
                      {['a', 'b', 'c', 'd'].map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
        <h3 className="text-md font-semibold text-text-primary mb-4">
          {editId ? 'Edit Question' : 'Add Question'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Question Text</label>
            <textarea value={form.questionText} onChange={(e) => update('questionText', e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background resize-none" placeholder="Enter the question..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['A', 'B', 'C', 'D', ...(exam?.optionsCount === 5 ? ['E'] : [])].map((label) => (
              <div key={label}>
                <label className="block text-sm font-medium text-text-primary mb-1">Option {label}</label>
                <input type="text" value={(form as any)[`option${label}`]}
                  onChange={(e) => update(`option${label}`, e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
                  placeholder={`Option ${label}`} />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Correct Answer</label>
            <div className="flex gap-4">
              {['a', 'b', 'c', 'd', ...(exam?.optionsCount === 5 ? ['e'] : [])].map((opt) => (
                <label key={opt} className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="correctOption" value={opt}
                    checked={form.correctOption === opt} onChange={(e) => update('correctOption', e.target.value)}
                    className="h-4 w-4 text-brand-indigo focus:ring-brand-indigo border-border" />
                  <span className="text-sm font-medium text-text-primary">{opt.toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={addQuestion} disabled={saving}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand-indigo hover:bg-brand-indigo/90 transition-colors disabled:opacity-70">
              {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {editId ? 'Update Question' : 'Add Question'}
            </button>
            {editId && (
              <button onClick={() => { setEditId(null); setForm(emptyForm); }}
                className="px-4 py-2 text-sm font-medium rounded-lg text-text-secondary border border-border hover:bg-gray-50 transition-colors">
                Cancel Edit
              </button>
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
