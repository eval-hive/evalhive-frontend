'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { FileText, BookOpen, Loader2, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

const navItems = [
  { name: 'Dashboard', href: '/student/dashboard', icon: FileText },
  { name: 'JAMB Mock', href: '/student/mock/jamb', icon: BookOpen },
];

export default function JambMockPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [disabledMessage, setDisabledMessage] = useState('');
  const ENGLISH_KEYWORD = 'english';

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/student/jamb/subjects');
        if (res.data.disabled) {
          setDisabledMessage(res.data.message || 'JAMB mock is currently disabled by your school.');
        }
        const allSubjects = res.data.subjects || [];
        setSubjects(allSubjects);
        // Auto-select English Literature
        const english = allSubjects.find((s: any) => s.name.toLowerCase().includes(ENGLISH_KEYWORD));
        if (english) setSelected([english.id]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const englishId = subjects.find(s => s.name.toLowerCase().includes(ENGLISH_KEYWORD))?.id;

  const handleToggle = (subjectId: string) => {
    if (subjectId === englishId) return; // English is locked
    if (selected.includes(subjectId)) {
      setSelected(prev => prev.filter(id => id !== subjectId));
    } else {
      if (selected.length >= 4) return; // Max 4
      setSelected(prev => [...prev, subjectId]);
    }
  };

  const handleStart = async () => {
    if (selected.length !== 4) {
      setError('Please select exactly 4 subjects (English is pre-selected).');
      return;
    }
    setError('');
    try {
      setStarting(true);
      const res = await api.post('/student/jamb/start', { subjectIds: selected });
      router.push(`/student/exam/${res.data.attemptId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start JAMB mock exam.');
      setStarting(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="JAMB Mock Exam" role="Student">
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-indigo" />
        </div>
      ) : disabledMessage ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-text-secondary">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-border" />
          <p className="font-medium">{disabledMessage}</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-text-secondary">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-border" />
          <p className="font-medium">No JAMB mock subjects are available yet.</p>
          <p className="text-sm mt-2">A subject appears here after its JAMB question bank has at least 50 questions.</p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          {/* Instructions */}
          <div className="bg-brand-indigo/5 border border-brand-indigo/20 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold text-brand-indigo mb-3">Instructions</h2>
            <ul className="space-y-2 text-sm text-text-secondary list-disc list-inside">
              <li>Select <strong>4 subjects</strong> in total — English is compulsory and pre-selected.</li>
              <li>The exam will contain questions from all 4 subjects mixed together.</li>
              <li>Time limit and question count depend on your school's question bank.</li>
              <li>Your score is shown immediately after submission.</li>
            </ul>
          </div>

          {/* Subject Selection */}
          <h3 className="text-lg font-bold text-text-primary mb-4">
            Select Your Subjects
            <span className="ml-3 text-sm font-normal text-text-secondary">
              ({selected.length}/4 selected)
            </span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {subjects.map(subject => {
              const isSelected = selected.includes(subject.id);
              const isEnglish = subject.id === englishId;
              const isDisabled = !isSelected && selected.length >= 4;

              return (
                <button
                  key={subject.id}
                  onClick={() => handleToggle(subject.id)}
                  disabled={isDisabled}
                  className={`
                    relative p-4 rounded-xl border-2 text-left transition-all
                    ${isSelected
                      ? 'border-brand-indigo bg-brand-indigo/5'
                      : isDisabled
                        ? 'border-border bg-background opacity-50 cursor-not-allowed'
                        : 'border-border bg-card hover:border-brand-indigo/50'}
                  `}
                >
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 text-brand-indigo absolute top-3 right-3" />
                  )}
                  <p className="font-medium text-text-primary text-sm">{subject.name}</p>
                  {isEnglish && (
                    <span className="text-[10px] text-brand-indigo font-medium mt-1 block">Compulsory</span>
                  )}
                </button>
              );
            })}
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button
            onClick={handleStart}
            disabled={selected.length !== 4 || starting}
            className="w-full py-3 bg-brand-indigo text-white rounded-xl font-bold text-base hover:bg-brand-indigo/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {starting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {starting ? 'Starting Exam...' : 'Start JAMB Mock Exam →'}
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
