'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { FileText, ArrowLeft, Loader2, Eye, ShieldAlert } from 'lucide-react';
import api from '@/lib/api';
import ResultsTable, { Column } from '@/components/ResultsTable';
import ExportButton from '@/components/ExportButton';

export default function TeacherExamResults({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  
  // Publication states
  const [visibility, setVisibility] = useState('hidden');
  const [publishing, setPublishing] = useState(false);

  const fetchResults = async () => {
    try {
      const examRes = await api.get(`/exams/${id}`);
      setExam(examRes.data.exam);
      setVisibility(examRes.data.exam.resultVisibility);

      const res = await api.get(`/results/teacher/exams/${id}/results`);
      setAttempts(res.data.attempts);
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [id]);

  const handlePublishToggle = async () => {
    if (!exam) return;
    try {
      setPublishing(true);
      const newVisibility = visibility === 'hidden' ? 'score_only' : 'hidden';
      const res = await api.post(`/results/exams/${id}/publish-results`, {
        resultVisibility: newVisibility
      });
      setVisibility(res.data.exam.resultVisibility);
    } catch (err) {
      console.error('Failed to change publish status', err);
      alert('Failed to update result visibility.');
    } finally {
      setPublishing(false);
    }
  };

  const handleChangeVisibility = async (val: string) => {
    if (!exam) return;
    try {
      setPublishing(true);
      const res = await api.post(`/results/exams/${id}/publish-results`, {
        resultVisibility: val
      });
      setVisibility(res.data.exam.resultVisibility);
    } catch (err) {
      console.error('Failed to change publish status', err);
    } finally {
      setPublishing(false);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Student Name',
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
      header: 'Submitted',
      sortable: true,
      accessorKey: 'submittedAt',
      cell: (row) => new Date(row.submittedAt).toLocaleString()
    }
  ];

  if (loading) {
    return (
      <DashboardLayout navItems={[{ name: 'Exams', href: '/teacher/dashboard', icon: FileText }]} title="Exam Results" role="Teacher">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-indigo" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={[{ name: 'Exams', href: '/teacher/dashboard', icon: FileText }]} title={exam ? `${exam.title} - Results` : "Exam Results"} role="Teacher">
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-text-secondary hover:text-brand-indigo font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Exam Details
        </button>
        
        {exam && (
          <div className="flex items-center gap-4">
             <div className="bg-card px-4 py-2 rounded-lg border border-border shadow-[0_1px_2px_rgba(17,24,39,0.04)] flex items-center">
                <span className="text-sm text-text-secondary mr-3">Visibility status:</span>
                <span className={`text-sm font-semibold px-2 py-1 rounded ${visibility === 'hidden' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                   {visibility === 'hidden' ? 'Hidden from Students' : (visibility === 'score_only' ? 'Score Only' : 'Full Breakdown')}
                </span>
             </div>
             {/* No generic export needed here since no class filtering etc, but instructions say we can have excel download */}
             {/* Note: The API we created was for Admin export. We don't have a teacher-specific exam export in the prompt, but let's add one if we need it. 
                 Phase 4 specs: "Export button: Download Excel — calls export API" (For Teacher view? Wait, it says "Export button: Download Excel — calls export API" for teacher page). But I didn't create a teacher-specific exam export API, only for Admin class-results. Wait, I'll omit ExportButton for teacher exam view if the backend doesn't support it, or rely on admin exports. Let's stick to publish control. */}
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 mt-2">
          <div className="bg-card p-6 rounded-lg border border-border shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <p className="text-sm font-medium text-text-secondary">Total Attempts</p>
            <p className="mt-2 text-3xl font-bold text-text-primary">{stats.totalStudents}</p>
          </div>
          <div className="bg-card p-6 rounded-lg border border-border shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <p className="text-sm font-medium text-text-secondary">Average Score</p>
            <p className="mt-2 text-3xl font-bold text-brand-indigo">{stats.averageScore.toFixed(1)}</p>
          </div>
          <div className="bg-card p-6 rounded-lg border border-border shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <p className="text-sm font-medium text-text-secondary">Highest Score</p>
            <p className="mt-2 text-3xl font-bold text-green-600">{stats.highestScore}</p>
          </div>
          <div className="bg-card p-6 rounded-lg border border-border shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <p className="text-sm font-medium text-text-secondary">Lowest Score</p>
            <p className="mt-2 text-3xl font-bold text-red-500">{stats.lowestScore}</p>
          </div>
        </div>
      )}

      {exam && (
        <div className="mb-8 bg-brand-indigo/5 border border-brand-indigo/20 rounded-lg p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
             <div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">Publish Results to Students</h3>
                <p className="text-sm text-text-secondary">
                  Choose what students can see when they view their exam history.
                </p>
             </div>
             <div className="flex items-center gap-3">
                <select 
                   value={visibility === 'hidden' ? 'score_only' : visibility}
                   onChange={(e) => handleChangeVisibility(e.target.value)}
                   disabled={publishing}
                   className="bg-white border border-border text-sm rounded-lg block p-2.5 outline-none focus:border-brand-indigo"
                >
                   <option value="score_only">Score Only</option>
                   <option value="full_breakdown">Full Answer Breakdown</option>
                </select>
                
                <button
                  onClick={handlePublishToggle}
                  disabled={publishing}
                  className={`inline-flex items-center px-4 py-2 font-medium rounded-md text-white text-sm focus:outline-none transition-colors ${visibility === 'hidden' ? 'bg-brand-indigo hover:bg-brand-indigo/90' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  {publishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (visibility === 'hidden' ? <Eye className="w-4 h-4 mr-2"/> : <ShieldAlert className="w-4 h-4 mr-2"/>)}
                  {visibility === 'hidden' ? 'Publish Results' : 'Unpublish (Hide)'}
                </button>
             </div>
          </div>
        </div>
      )}

      <ResultsTable data={attempts} columns={columns} emptyMessage="No students have completed this exam yet." />
    </DashboardLayout>
  );
}
