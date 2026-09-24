'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { FileSpreadsheet, ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import ResultsTable, { Column } from '@/components/ResultsTable';
import ExportButton from '@/components/ExportButton';
import MathText from '@/components/MathText';

export default function AdminExamResultDetail({ params }: { params: Promise<{ examId: string }> }) {
  const router = useRouter();
  const { examId } = use(params);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<'position' | 'name' | 'admission'>('position');

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
  const rankedAttempts = [...attempts]
    .sort((a, b) => (b.score || 0) - (a.score || 0) || `${a.student.firstName} ${a.student.lastName}`.localeCompare(`${b.student.firstName} ${b.student.lastName}`))
    .map((attempt, index) => ({
      ...attempt,
      position: index + 1,
      studentName: `${attempt.student.firstName} ${attempt.student.lastName}`,
      admissionNumber: attempt.student.admissionNumber,
      percentage: attempt.totalQuestions > 0 ? ((attempt.score || 0) / attempt.totalQuestions) * 100 : 0,
    }));

  const sortedAttempts = [...rankedAttempts].sort((a, b) => {
    if (sortMode === 'name') return a.studentName.localeCompare(b.studentName);
    if (sortMode === 'admission') return a.admissionNumber.localeCompare(b.admissionNumber, undefined, { numeric: true });
    return a.position - b.position;
  });

  const columns: Column<any>[] = [
    {
       header: 'Position',
       sortable: true,
       accessorKey: 'position',
       cell: (row) => <span className="font-bold text-text-primary">{row.position}</span>
    },
    {
       header: 'Name',
       sortable: true,
       accessorKey: 'studentName',
       cell: (row) => row.studentName
    },
    {
       header: 'Admission No',
       sortable: true,
       accessorKey: 'admissionNumber',
       cell: (row) => row.admissionNumber
    },
    {
       header: 'Score',
       sortable: true,
       accessorKey: 'score',
       cell: (row) => <span className="font-bold text-brand-indigo">{row.score}</span>
    },
    {
       header: 'Percentage',
       sortable: true,
       accessorKey: 'percentage',
       cell: (row) => `${row.percentage.toFixed(1)}%`
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
                        <MathText>{qa.questionText}</MathText>
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

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold text-text-primary">Student Submissions</h3>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          Sort by
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as typeof sortMode)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-text-primary outline-none focus:border-brand-indigo"
          >
            <option value="position">Position (highest score first)</option>
            <option value="name">Name (A-Z)</option>
            <option value="admission">Admission Number</option>
          </select>
        </label>
      </div>
      <ResultsTable data={sortedAttempts} columns={columns} emptyMessage="No attempts yet." />

    </DashboardLayout>
  );
}
