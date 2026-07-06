'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { FileText, BookOpen, Loader2, Clock, HelpCircle } from 'lucide-react';
import api from '@/lib/api';

const navItems = [
  { name: 'Dashboard', href: '/student/dashboard', icon: FileText },
  { name: 'WAEC Mock', href: '/student/mock/waec', icon: BookOpen },
];

export default function WaecMockPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [disabledMessage, setDisabledMessage] = useState('');

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const res = await api.get('/student/waec/papers');
        if (res.data.disabled) {
          setDisabledMessage(res.data.message || 'WAEC mock is currently disabled by your school.');
        }
        setPapers(res.data.papers || []);
      } catch (err: any) {
        const status = err.response?.status;
        setError(status === 403
          ? 'This page is available to student accounts only.'
          : err.response?.data?.error || 'Could not load WAEC mock papers. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchPapers();
  }, []);

  const handleStart = async (paperId: string) => {
    setError('');
    try {
      setStarting(paperId);
      const res = await api.post(`/student/waec/papers/${paperId}/start`);
      router.push(`/student/exam/${res.data.attemptId}`);
    } catch (err: any) {
      if (err.response?.status === 409) {
        // Already in progress, go to that attempt
        router.push(`/student/exam/${err.response.data.attemptId}`);
      } else {
        setError(err.response?.data?.error || 'Failed to start paper.');
        setStarting(null);
      }
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="WAEC Mock Exams" role="Student">
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-indigo" />
        </div>
      ) : error ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center text-text-secondary">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-border" />
          <p className="font-medium text-text-primary">Unable to load WAEC mock</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      ) : disabledMessage ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center text-text-secondary">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-border" />
          <p className="font-medium">{disabledMessage}</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center text-text-secondary">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-border" />
          <p className="font-medium">No WAEC mock papers are available yet.</p>
          <p className="text-sm mt-2">Ask your school admin to set up WAEC mock papers.</p>
        </div>
      ) : (
        <div>
          <p className="text-text-secondary text-sm mb-8">
            Select a WAEC subject paper to start. Each paper is timed and scored independently.
          </p>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {papers.map(paper => {
              const hasAttempt = paper.lastScore !== null;
              const percentage = hasAttempt && paper.lastTotalQuestions > 0
                ? ((paper.lastScore / paper.lastTotalQuestions) * 100).toFixed(1)
                : null;

              return (
                <div key={paper.id} className="bg-card rounded-lg border border-border shadow-[0_1px_2px_rgba(17,24,39,0.04)] overflow-hidden">
                  <div className="p-6">
                    <div className="w-10 h-10 rounded-lg bg-brand-indigo/10 flex items-center justify-center mb-4">
                      <BookOpen className="w-5 h-5 text-brand-indigo" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary mb-1">{paper.subject || paper.title}</h3>
                    <p className="text-sm text-text-secondary mb-4">{paper.title}</p>

                    <div className="flex items-center gap-4 text-xs text-text-secondary mb-4">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        {paper.questionCount} Questions
                      </span>
                      {paper.durationMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {paper.durationMinutes} mins
                        </span>
                      )}
                    </div>

                    {hasAttempt && (
                      <div className="mb-4 p-3 rounded-lg bg-background-alt border border-border text-xs">
                        <p className="text-text-secondary">Last Attempt Score</p>
                        <p className="font-bold text-text-primary mt-0.5">{paper.lastScore}/{paper.lastTotalQuestions} <span className="text-brand-indigo font-normal">({percentage}%)</span></p>
                      </div>
                    )}
                  </div>

                  <div className="px-6 pb-6">
                    <button
                      onClick={() => handleStart(paper.id)}
                      disabled={starting === paper.id}
                      className="w-full py-2.5 bg-brand-indigo text-white rounded-lg text-sm font-medium hover:bg-brand-indigo/90 disabled:opacity-70 flex items-center justify-center"
                    >
                      {starting === paper.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {starting === paper.id ? 'Starting...' : (hasAttempt ? 'Retry Paper' : 'Start Paper')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
