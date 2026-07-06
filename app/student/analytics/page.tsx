'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { BarChart2, Loader2, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import api from '@/lib/api';

export default function StudentMockAnalytics() {
  const [analytics, setAnalytics] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/student/mock-analytics');
        setAnalytics(res.data.analytics || {});
      } catch (err: any) {
        setError(err.response?.status === 403
          ? 'This page is available to student accounts only.'
          : err.response?.data?.error || 'Could not load mock analytics. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <DashboardLayout navItems={[{ name: 'Dashboard', href: '/student/dashboard', icon: FileText }]} title="Mock Analytics" role="Student">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-indigo" />
        </div>
      </DashboardLayout>
    );
  }

  const subjects = Object.keys(analytics);

  return (
    <DashboardLayout 
      navItems={[
         { name: 'Dashboard', href: '/student/dashboard', icon: FileText }, 
         { name: 'Analytics', href: '/student/analytics', icon: BarChart2 }
      ]} 
      title="Mock Exam Analytics" 
      role="Student"
    >
      <div className="mb-8 flex flex-col justify-center">
         <h2 className="text-lg font-bold text-text-primary mb-2">Subject Performance Trends</h2>
         <p className="text-text-secondary text-sm">
            Track your progress across multiple attempts of JAMB and WAEC mock exams.
         </p>
      </div>

      {error ? (
         <div className="bg-card rounded-lg border border-border p-12 text-center text-text-secondary shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <BarChart2 className="w-12 h-12 mx-auto mb-4 text-border" />
            <p className="font-medium text-text-primary">Unable to load analytics</p>
            <p className="text-sm mt-2">{error}</p>
         </div>
      ) : subjects.length === 0 ? (
         <div className="bg-card rounded-lg border border-border p-12 text-center text-text-secondary shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <BarChart2 className="w-12 h-12 mx-auto mb-4 text-border" />
            <p>You have not taken any mock exams yet.</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {subjects.map(subject => {
               const attempts = analytics[subject];
               
               return (
                  <div key={subject} className="bg-card border border-border rounded-lg shadow-[0_1px_2px_rgba(17,24,39,0.04)] overflow-hidden">
                     <div className="bg-background-alt px-6 py-4 border-b border-border">
                        <h3 className="text-lg font-bold text-text-primary">{subject}</h3>
                        <p className="text-xs text-text-secondary">{attempts.length} {attempts.length === 1 ? 'Attempt' : 'Attempts'}</p>
                     </div>
                     <div className="p-6">
                        <div className="space-y-4">
                           {attempts.map((attempt, idx) => {
                              // Calculate trend visually
                              let trendIcon = <Minus className="w-4 h-4 text-text-secondary" />;
                              if (idx > 0) {
                                 const prev = attempts[idx - 1];
                                 if (attempt.percentage > prev.percentage) {
                                    trendIcon = <TrendingUp className="w-4 h-4 text-green-500" />;
                                 } else if (attempt.percentage < prev.percentage) {
                                    trendIcon = <TrendingDown className="w-4 h-4 text-red-500" />;
                                 }
                              }
                              
                              return (
                                 <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                                    <div className="flex items-center gap-4">
                                       <div className="w-8 h-8 rounded-full bg-brand-indigo/10 text-brand-indigo flex items-center justify-center font-bold text-sm">
                                          {idx + 1}
                                       </div>
                                       <div>
                                          <p className="text-sm font-semibold text-text-primary">Attempt {idx + 1}</p>
                                          <p className="text-xs text-text-secondary">{new Date(attempt.date).toLocaleDateString()}</p>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                       <div className="text-right">
                                          <p className="text-lg font-bold text-text-primary">{attempt.percentage.toFixed(1)}%</p>
                                          <p className="text-xs text-text-secondary">Score: {attempt.score}/{attempt.totalQuestions}</p>
                                       </div>
                                       <div className="w-6 flex justify-end">
                                          {trendIcon}
                                       </div>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      )}

    </DashboardLayout>
  );
}
