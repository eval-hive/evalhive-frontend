'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen, Plus, ArrowLeft, Loader2 } from 'lucide-react';
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

  const emptyForm = { questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'a' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadQuestions(); }, [id]);

  const loadQuestions = async () => {
    try {
      const res = await api.get(`/exams/${id}`);
      setQuestions(res.data.exam.questions || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  const addQuestion = async () => {
    setError('');
    if (!form.questionText || !form.optionA || !form.optionB || !form.optionC || !form.optionD) {
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

  const startEdit = (questionId: string) => {
    const q = questions.find(q => q.id === questionId);
    if (q) {
      setForm({
        questionText: q.questionText, optionA: q.optionA, optionB: q.optionB,
        optionC: q.optionC, optionD: q.optionD, correctOption: q.correctOption,
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

  return (
    <DashboardLayout navItems={navItems} title="Exam Questions" role="School Admin">
      <button onClick={() => router.push(`/admin/school/exams/${id}`)}
        className="inline-flex items-center text-sm text-text-secondary hover:text-brand-indigo mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Exam
      </button>

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
            {['A', 'B', 'C', 'D'].map((label) => (
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
              {['a', 'b', 'c', 'd'].map((opt) => (
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
      </div>
    </DashboardLayout>
  );
}
