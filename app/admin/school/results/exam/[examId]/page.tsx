'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { FileSpreadsheet, ArrowLeft, Loader2, Download } from 'lucide-react';
import api from '@/lib/api';
import ResultsTable, { Column } from '@/components/ResultsTable';
import ExportButton from '@/components/ExportButton';

export default function AdminExamResultDetail({ params }: { params: Promise<{ examId: string }> }) {
  const router = useRouter();
  const { examId } = use(params);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/results/admin/results/exam/${examId}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [examId]);

  if (loading) {
    return (
      <DashboardLayout navItems={[]} title="Exam Analysis" role="School Admin">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-indigo" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data || !data.exam) {
    return (
      <DashboardLayout navItems={[]} title="Exam Analysis" role="School Admin">
        <div className="text-center py-20 text-text-secondary">Exam not found.</div>
      </DashboardLayout>
    );
  }

  const { exam, attempts, stats, questionAnalysis } = data;

  const columns: Column<any>[] = [
    {
       header: 'Name',
       sortable: true,
       accessorKey: 'id',
       cell: (row) => `${row.student.firstName} ${row.student.lastName}`
    },
    {
       header: 'Admission No',
       sortable: true,
       accessorKey: 'id',
       cell: (row) => row.student.admissionNumber
    },
    {
       header: 'Score',
       sortable: true,
       accessorKey: 'score',
       cell: (row) => <span className="font-bold text-brand-indigo">{row.score}</span>
    },
    {
       header: 'Percentage',
       sortable: false,
       accessorKey: 'score',
       cell: (row) => {
          const pct = row.totalQuestions > 0 ? (row.score / row.totalQuestions) * 100 : 0;
          return `${pct.toFixed(1)}%`;
       }
    },
    {
       header: 'Time Taken',
       sortable: true,
       accessorKey: 'timeTakenSeconds',
       cell: (row) => {
          const min = Math.floor(row.timeTakenSeconds / 60);
          const sec = row.timeTakenSeconds % 60;
          return `${min}m ${sec}s`;
       }
    },
    {
        header: 'Report Card',
        cell: (row) => {
           // We can individual export per student
           return (
              <ExportButton 
                 url={`/results/admin/export/student-report/${row.studentId}?session_id=${exam.sessionId}&term_id=${exam.termId}`}
                 filename={`report_${row.student.admissionNumber}.pdf`}
                 label="PDF"
                 className="!px-2 !py-1 !text-xs"
              />
           )
        }
    }
  ];

  return (
    <DashboardLayout 
       navItems={[
          { name: 'School Dashboard', href: '/admin/school', icon: FileSpreadsheet },
          { name: 'Results', href: '/admin/school/results', icon: FileSpreadsheet },
       ]} 
       title={`${exam.title} - Full Analysis`}
       role="School Admin"
    >
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-text-secondary hover:text-brand-indigo font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Results
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-card p-5 rounded-lg border border-border shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <p className="text-xs font-medium text-text-secondary uppercase">Students</p>
            <p className="mt-2 text-2xl font-bold text-text-primary">{stats.totalStudents}</p>
          </div>
          <div className="bg-card p-5 rounded-lg border border-border shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <p className="text-xs font-medium text-text-secondary uppercase">Class Average</p>
            <p className="mt-2 text-2xl font-bold text-brand-indigo">{stats.averageScore.toFixed(1)} <span className="text-sm font-normal text-text-secondary">/ {exam.questions.length}</span></p>
          </div>
          <div className="bg-card p-5 rounded-lg border border-border shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <p className="text-xs font-medium text-text-secondary uppercase">Highest</p>
            <p className="mt-2 text-2xl font-bold text-green-600">{stats.highestScore}</p>
          </div>
          <div className="bg-card p-5 rounded-lg border border-border shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <p className="text-xs font-medium text-text-secondary uppercase">Lowest</p>
            <p className="mt-2 text-2xl font-bold text-red-500">{stats.lowestScore}</p>
          </div>
        </div>
      )}

      {/* Per Question Analysis */}
      <h3 className="text-lg font-bold text-text-primary mb-4">Per-Question Analysis</h3>
      <div className="bg-card rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)] mb-10 overflow-hidden">
         {questionAnalysis && questionAnalysis.length > 0 ? (
            <div className="space-y-6">
               {questionAnalysis.map((qa: any, idx: number) => (
                  <div key={qa.questionId} className="border-b border-border last:border-0 pb-6 last:pb-0">
                     <p className="text-sm font-medium text-text-primary mb-2 line-clamp-2">
                        <span className="font-bold mr-2 text-brand-indigo">Q{idx + 1}.</span> 
                        {qa.questionText}
                     </p>
                     <div className="flex items-center gap-4 text-xs mt-3">
                        <div className="flex-1 w-full bg-gray-200 rounded-full h-2.5">
                           <div className="bg-brand-emerald h-2.5 rounded-full transition-all" style={{ width: `${qa.percentageCorrect}%` }}></div>
                        </div>
                        <span className={`font-bold w-12 text-right ${qa.percentageCorrect > 50 ? 'text-brand-emerald' : (qa.percentageCorrect > 25 ? 'text-brand-gold' : 'text-brand-red')}`}>
                           {qa.percentageCorrect.toFixed(0)}%
                        </span>
                        <span className="text-text-secondary w-16 text-right">Correct</span>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <p className="text-text-secondary text-center text-sm py-8">No analysis available yet.</p>
         )}
      </div>

      <h3 className="text-lg font-bold text-text-primary mb-4">Student Submissions</h3>
      <ResultsTable data={attempts} columns={columns} emptyMessage="No attempts yet." />

    </DashboardLayout>
  );
}
