'use client';

import { 
  Monitor, 
  History, 
  BarChart,
  PlayCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';

const navItems = [
  { name: 'My Exams', href: '/student/dashboard', icon: Monitor },
  { name: 'History & Results', href: '/student/history', icon: History },
  { name: 'Mock Analytics', href: '/student/analytics', icon: BarChart },
];

export default function StudentDashboard() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await api.get('/student/exams');
        setExams(res.data.exams);
      } catch (err) {
        console.error('Error fetching exams', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  return (
    <DashboardLayout navItems={navItems} title="My Exams" role="Student">
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Active Exams</h2>
        
        {loading ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center shadow-sm">
            <div className="animate-pulse h-6 w-32 bg-background-alt mx-auto rounded"></div>
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center shadow-sm">
            <Monitor className="mx-auto h-12 w-12 text-text-secondary/40" />
            <h3 className="mt-4 text-sm font-medium text-text-primary">No exams available</h3>
            <p className="mt-1 text-sm text-text-secondary">
              There are no exams currently active for your class.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => {
              const hasInProgress = !!exam.inProgressAttemptId;
              
              return (
                <div 
                  key={exam.id} 
                  className={`bg-card rounded-xl border p-6 shadow-sm transition-colors cursor-pointer group ${
                    hasInProgress ? 'border-brand-indigo/50 bg-brand-indigo/5 hover:bg-brand-indigo/10' : 'border-border hover:border-brand-primary/50'
                  }`}
                  onClick={() => router.push(hasInProgress ? `/student/exam/${exam.id}` : `/student/exam/${exam.id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-semibold px-2 py-1 bg-background-alt text-brand-primary rounded-full">
                        {exam.subject.name}
                      </span>
                      <h3 className="mt-3 text-lg font-medium text-text-primary group-hover:text-brand-primary transition-colors">
                        {exam.title}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-text-secondary mt-4">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{exam.durationMinutes} mins</span>
                  </div>

                  <div className="mt-6">
                    <button className={`w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center transition-colors ${
                      hasInProgress 
                        ? 'bg-brand-indigo text-white hover:bg-brand-indigo/90' 
                        : 'bg-brand-primary text-white hover:bg-brand-primary/90'
                    }`}>
                      {hasInProgress ? 'Resume Exam' : 'Start Exam'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mb-8 opacity-50 pointer-events-none">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
          Practice Exams (Mock) 
          <span className="ml-3 text-xs font-medium px-2 py-1 bg-background text-text-secondary rounded">Coming soon</span>
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-text-primary">JAMB Mock</h3>
                <p className="text-sm text-text-secondary mt-1">4 Subjects • Time limit: 2hrs</p>
              </div>
              <PlayCircle className="h-6 w-6 text-text-secondary" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
             <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-text-primary">WAEC Mock</h3>
                <p className="text-sm text-text-secondary mt-1">Single Subject • Select to start</p>
              </div>
              <PlayCircle className="h-6 w-6 text-text-secondary" />
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
