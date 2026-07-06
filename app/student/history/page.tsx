'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { History, Loader2, FileText } from 'lucide-react';
import api from '@/lib/api';
import ResultsTable, { Column } from '@/components/ResultsTable';

export default function StudentHistory() {
  const router = useRouter();
  
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/student/history');
        setAttempts(res.data.attempts || []);
      } catch (err: any) {
        setError(err.response?.status === 403
          ? 'This page is available to student accounts only.'
          : err.response?.data?.error || 'Could not load exam history. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const columns: Column<any>[] = [
    {
      header: 'Exam Title',
      sortable: true,
      accessorKey: 'title',
      cell: (row) => row.exam.title
    },
    {
      header: 'Type',
      sortable: true,
      accessorKey: 'type',
      cell: (row) => {
         const typeMap: Record<string, string> = {
            'internal': 'Internal',
            'jamb_mock': 'JAMB Mock',
            'waec_mock': 'WAEC Mock'
         };
         return typeMap[row.exam.examType] || row.exam.examType;
      }
    },
    {
      header: 'Subject',
      sortable: true,
      accessorKey: 'subject',
      cell: (row) => row.exam.subject.name
    },
    {
      header: 'Score',
      sortable: true,
      accessorKey: 'score',
      cell: (row) => {
         const isMock = row.exam.examType === 'jamb_mock' || row.exam.examType === 'waec_mock';
         const showScore = isMock || row.exam.resultVisibility !== 'hidden';
         if (!showScore) return <span className="text-text-secondary italic">Pending</span>;
         return <span className="font-bold text-brand-indigo">{row.score}</span>;
      }
    },
    {
      header: 'Percentage',
      sortable: false,
      accessorKey: 'score',
      cell: (row) => {
         const isMock = row.exam.examType === 'jamb_mock' || row.exam.examType === 'waec_mock';
         const showScore = isMock || row.exam.resultVisibility !== 'hidden';
         if (!showScore) return <span className="text-text-secondary italic">-</span>;
         const pct = row.totalQuestions > 0 ? (row.score / row.totalQuestions) * 100 : 0;
         return `${pct.toFixed(1)}%`;
      }
    },
    {
      header: 'Date Taken',
      sortable: true,
      accessorKey: 'submittedAt',
      cell: (row) => new Date(row.submittedAt).toLocaleDateString()
    }
  ];

  if (loading) {
    return (
      <DashboardLayout navItems={[{ name: 'Dashboard', href: '/student/dashboard', icon: FileText }, { name: 'Exam History', href: '/student/history', icon: History }]} title="Exam History" role="Student">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-indigo" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      navItems={[
         { name: 'Dashboard', href: '/student/dashboard', icon: FileText }, 
         { name: 'Exam History', href: '/student/history', icon: History }
      ]} 
      title="My Exam History" 
      role="Student"
    >
      <div className="mb-6 flex flex-col justify-center">
         <p className="text-text-secondary text-sm">
            View all your submitted exams. Click on an exam row to view detailed results.
         </p>
      </div>

      {error ? (
         <div className="bg-card rounded-lg border border-border p-12 text-center text-text-secondary shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <History className="w-12 h-12 mx-auto mb-4 text-border" />
            <p className="font-medium text-text-primary">Unable to load exam history</p>
            <p className="text-sm mt-2">{error}</p>
         </div>
      ) : (
         <ResultsTable 
            data={attempts} 
            columns={columns} 
            emptyMessage="You haven't completed any exams yet." 
            onRowClick={(row) => router.push(`/student/result/${row.id}`)}
         />
      )}

    </DashboardLayout>
  );
}
