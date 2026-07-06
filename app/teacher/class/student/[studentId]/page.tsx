'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Users, ArrowLeft, Loader2, User as UserIcon } from 'lucide-react';
import api from '@/lib/api';
import ResultsTable, { Column } from '@/components/ResultsTable';

export default function ClassTeacherStudentPage({ params }: { params: Promise<{ studentId: string }> }) {
  const router = useRouter();
  const { studentId } = use(params);
  
  const [student, setStudent] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const [studentsRes, resultsRes] = await Promise.all([
          api.get('/results/class-teacher/students'),
          api.get('/results/class-teacher/class-results')
        ]);
        
        const allStudents = studentsRes.data.students || [];
        const found = allStudents.find((s: any) => s.id === studentId);
        if (found) {
           setStudent(found);
           const allAttempts = resultsRes.data.attempts || [];
           setAttempts(allAttempts.filter((a: any) => a.studentId === studentId && a.status === 'submitted'));
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [studentId]);

  if (loading) {
    return (
      <DashboardLayout navItems={[{ name: 'My Class', href: '/teacher/class', icon: Users }]} title="Student Details" role="Class Teacher">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-indigo" />
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout navItems={[{ name: 'My Class', href: '/teacher/class', icon: Users }]} title="Student Details" role="Class Teacher">
        <div className="text-center py-20 text-text-secondary">Student not found in your class.</div>
      </DashboardLayout>
    );
  }

  const columns: Column<any>[] = [
    {
      header: 'Exam Title',
      sortable: true,
      accessorKey: 'exam',
      cell: (row) => row.exam.title
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
      header: 'Submitted',
      sortable: true,
      accessorKey: 'submittedAt',
      cell: (row) => new Date(row.submittedAt).toLocaleDateString()
    }
  ];

  // Simple trend: calculate average per subject
  const subjectAverages = new Map<string, { total: number, count: number }>();
  attempts.forEach(a => {
     const subj = a.exam.subject.name;
     if (!subjectAverages.has(subj)) subjectAverages.set(subj, { total: 0, count: 0 });
     const d = subjectAverages.get(subj)!;
     d.total += ((a.score || 0) / a.totalQuestions) * 100;
     d.count += 1;
  });

  const subjectStats = Array.from(subjectAverages.entries()).map(([subj, data]) => ({
     subject: subj,
     average: data.total / data.count,
     count: data.count
  }));

  return (
    <DashboardLayout 
      navItems={[{ name: 'My Class', href: '/teacher/class', icon: Users }]} 
      title={`${student.firstName} ${student.lastName}`}
      role="Class Teacher"
    >
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-text-secondary hover:text-brand-indigo font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
         <div className="col-span-1 md:col-span-1 bg-card p-6 rounded-lg border border-border shadow-[0_1px_2px_rgba(17,24,39,0.04)] flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 rounded-full bg-brand-indigo/10 flex items-center justify-center mb-4">
               <UserIcon className="w-8 h-8 text-brand-indigo" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">{student.firstName} {student.lastName}</h2>
            <p className="text-sm text-text-secondary mt-1">{student.admissionNumber}</p>
         </div>

         <div className="col-span-1 md:col-span-3 bg-card p-6 rounded-lg border border-border shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <h3 className="text-sm font-semibold text-text-secondary uppercase mb-4">Subject Averages</h3>
            {subjectStats.length > 0 ? (
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {subjectStats.map(stat => (
                     <div key={stat.subject} className="p-4 rounded-lg bg-background-alt border border-border flex flex-col justify-between">
                        <p className="text-xs text-text-secondary mb-1">{stat.subject}</p>
                        <p className="text-xl font-bold text-text-primary mb-1">{stat.average.toFixed(1)}%</p>
                        <p className="text-[10px] text-text-secondary">{stat.count} {stat.count === 1 ? 'Exam' : 'Exams'}</p>
                     </div>
                  ))}
               </div>
            ) : (
               <p className="text-sm text-text-secondary">No exams completed yet.</p>
            )}
         </div>
      </div>

      <h3 className="text-lg font-bold text-text-primary mb-4">Exam History</h3>
      <ResultsTable data={attempts} columns={columns} emptyMessage={`${student.firstName} has not completed any exams yet.`} />

    </DashboardLayout>
  );
}
