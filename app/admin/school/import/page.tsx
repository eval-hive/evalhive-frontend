'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FileSpreadsheet, UploadCloud, Loader2, Trash2, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

const navItems = [
  { name: 'School Dashboard', href: '/admin/school', icon: FileSpreadsheet },
  { name: 'Import Questions', href: '/admin/school/import', icon: UploadCloud },
];

type Step = 'upload' | 'processing' | 'review' | 'success';

export default function AdminImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [targetType, setTargetType] = useState('internal');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [jobId, setJobId] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [confirmedExamName, setConfirmedExamName] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/exams?status=approved'),
      api.get('/subjects')
    ]).then(([examRes, subjectRes]) => {
      setExams(examRes.data.exams || []);
      setSubjects(subjectRes.data.subjects || []);
    }).catch(console.error);
  }, []);

  const handleUpload = async () => {
    if (!file || (targetType === 'internal' && !selectedExamId) || (targetType !== 'internal' && !selectedSubjectId)) {
      setError('Please select a file and question bank target first.');
      return;
    }
    setError('');
    setStep('processing');

    try {
      // 1. Upload the file
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/admin/import/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newJobId = uploadRes.data.jobId;
      setJobId(newJobId);

      // 2. Immediately process it
      const processRes = await api.post(`/admin/import/${newJobId}/process`);
      setQuestions(processRes.data.questions || []);
      setStep('review');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload or processing failed.');
      setStep('upload');
    }
  };

  const handleDeleteQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, field: string, value: string) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleConfirm = async () => {
    if (questions.length === 0) {
      setError('No questions to import.');
      return;
    }
    setError('');
    try {
      setStep('processing');
      const res = await api.post(`/admin/import/${jobId}/confirm`, {
        examType: targetType,
        examId: targetType === 'internal' ? selectedExamId : undefined,
        subjectId: targetType !== 'internal' ? selectedSubjectId : undefined,
        questions
      });
      setConfirmedExamName(res.data.message);
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Confirmation failed.');
      setStep('review');
    }
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setSelectedExamId('');
    setTargetType('internal');
    setSelectedSubjectId('');
    setJobId('');
    setQuestions([]);
    setError('');
    setConfirmedExamName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <DashboardLayout navItems={navItems} title="Import Questions" role="School Admin">

      {step === 'upload' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-lg border border-border p-8 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <h2 className="text-xl font-bold text-text-primary mb-2">AI-Assisted Question Import</h2>
            <p className="text-text-secondary text-sm mb-8">
              Upload a Word (.docx) or PDF file containing multiple-choice questions. Our AI will extract and structure them for your review before import.
            </p>

            <div className="mb-6 rounded-lg border border-border bg-background p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-2">Upload guidelines</h3>
              <div className="grid gap-4 text-xs text-text-secondary sm:grid-cols-2">
                <div>
                  <p className="font-medium text-text-primary mb-1">Do</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Upload .docx or clear text-based PDF files.</li>
                    <li>Number each question and label options A-D.</li>
                    <li>Include the correct answer after each question where possible.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-text-primary mb-1">Do not</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Upload scanned images or handwritten pages.</li>
                    <li>Mix multiple subjects in one upload.</li>
                    <li>Import without reviewing answers and options first.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Question bank target */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-1">Where should these questions go?</label>
              <select
                value={targetType}
                onChange={e => {
                  setTargetType(e.target.value);
                  setSelectedExamId('');
                  setSelectedSubjectId('');
                }}
                className="w-full border border-border rounded-lg p-2.5 text-sm outline-none focus:border-brand-indigo"
              >
                <option value="internal">Internal Exam</option>
                <option value="jamb_mock">JAMB Mock Question Bank</option>
                <option value="waec_mock">WAEC Mock Question Bank</option>
              </select>
            </div>

            {targetType === 'internal' ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-1">Internal exam</label>
                <select
                  value={selectedExamId}
                  onChange={e => setSelectedExamId(e.target.value)}
                  className="w-full border border-border rounded-lg p-2.5 text-sm outline-none focus:border-brand-indigo"
                >
                  <option value="">Select an exam...</option>
                  {exams.filter((exam: any) => exam.examType === 'internal').map((exam: any) => (
                    <option key={exam.id} value={exam.id}>{exam.title}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-1">Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={e => setSelectedSubjectId(e.target.value)}
                  className="w-full border border-border rounded-lg p-2.5 text-sm outline-none focus:border-brand-indigo"
                >
                  <option value="">Select a subject...</option>
                  {subjects.map((subject: any) => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
                {targetType === 'jamb_mock' && (
                  <p className="mt-2 text-xs text-text-secondary">
                    JAMB subjects become selectable for students only after this bank has at least 50 active questions.
                  </p>
                )}
              </div>
            )}

            {/* File drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:border-brand-indigo/50 transition-colors"
            >
              <UploadCloud className="w-10 h-10 text-text-secondary mx-auto mb-3" />
              <p className="font-medium text-text-primary">{file ? file.name : 'Click to select a file'}</p>
              <p className="text-xs text-text-secondary mt-1">Accepts .docx and .pdf files (max 20MB)</p>
              <input
                ref={fileRef}
                type="file"
                accept=".docx,.pdf"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </div>

            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

            <button
              onClick={handleUpload}
              disabled={!file || (targetType === 'internal' && !selectedExamId) || (targetType !== 'internal' && !selectedSubjectId)}
              className="mt-6 w-full py-3 bg-brand-indigo text-white rounded-lg font-bold hover:bg-brand-indigo/90 disabled:opacity-50"
            >
              Upload & Extract Questions →
            </button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-brand-indigo" />
          <p className="font-medium text-text-primary">AI is extracting questions from your file...</p>
          <p className="text-sm text-text-secondary">This may take 30–60 seconds.</p>
        </div>
      )}

      {step === 'review' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Review Extracted Questions</h2>
              <p className="text-text-secondary text-sm">{questions.length} questions extracted. Edit or delete as needed before confirming.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={reset} className="px-4 py-2 border border-border text-text-secondary rounded-lg text-sm hover:bg-background">
                Start Over
              </button>
              <button
                onClick={handleConfirm}
                disabled={questions.length === 0}
                className="px-4 py-2 bg-brand-emerald text-white rounded-lg text-sm font-bold hover:bg-brand-emerald/90 disabled:opacity-50"
              >
                Import {questions.length} Questions →
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                <div className="flex items-start justify-between mb-4">
                  <span className="font-bold text-brand-indigo text-sm">Q{idx + 1}</span>
                  <button onClick={() => handleDeleteQuestion(idx)} className="text-text-secondary hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-medium text-text-secondary uppercase mb-1 block">Question</label>
                  <textarea
                    value={q.question_text}
                    onChange={e => handleQuestionChange(idx, 'question_text', e.target.value)}
                    className="w-full border border-border rounded-lg p-2.5 text-sm outline-none focus:border-brand-indigo resize-none"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {['a', 'b', 'c', 'd'].map(opt => (
                    <div key={opt}>
                      <label className="text-xs font-medium text-text-secondary uppercase mb-1 block">Option {opt.toUpperCase()}</label>
                      <input
                        value={q[`option_${opt}`] || ''}
                        onChange={e => handleQuestionChange(idx, `option_${opt}`, e.target.value)}
                        className="w-full border border-border rounded-lg p-2.5 text-sm outline-none focus:border-brand-indigo"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary uppercase mb-1 block">Correct Answer</label>
                  <select
                    value={q.correct_option || ''}
                    onChange={e => handleQuestionChange(idx, 'correct_option', e.target.value)}
                    className="border border-border rounded-lg p-2.5 text-sm outline-none focus:border-brand-indigo"
                  >
                    <option value="">Unknown</option>
                    {['a', 'b', 'c', 'd'].map(opt => (
                      <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleConfirm}
              disabled={questions.length === 0}
              className="px-6 py-3 bg-brand-emerald text-white rounded-lg font-bold hover:bg-brand-emerald/90 disabled:opacity-50"
            >
              Confirm Import ({questions.length} Questions) →
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="flex flex-col items-center justify-center h-64 gap-6 text-center">
          <CheckCircle className="w-16 h-16 text-brand-emerald" />
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Import Successful!</h2>
            <p className="text-text-secondary">{confirmedExamName}</p>
          </div>
          <button onClick={reset} className="px-6 py-2 bg-brand-indigo text-white rounded-lg font-medium hover:bg-brand-indigo/90">
            Import More Questions
          </button>
        </div>
      )}

    </DashboardLayout>
  );
}
