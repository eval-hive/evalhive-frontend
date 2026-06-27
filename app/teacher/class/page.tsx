'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Users, Loader2, BookOpen, FileText } from 'lucide-react';
import api from '@/lib/api';
import ResultsTable, { Column } from '@/components/ResultsTable';
import ExportButton from '@/components/ExportButton';

export default function ClassTeacherPage() {
  const router = useRouter();
  
  const [students, setStudents] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<{name: string, sessionId: string, classLevelId: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const [studentsRes, resultsRes] = await Promise.all([
          api.get('/results/class-teacher/students'),
          api.get('/results/class-teacher/class-results')
        ]);
        
        setStudents(studentsRes.data.students || []);
        setAttempts(resultsRes.data.attempts || []);
        
        if (studentsRes.data.classLevel) {
           setClassInfo({
              name: studentsRes.data.classLevel,
              sessionId: resultsRes.data.sessionId,
              classLevelId: resultsRes.data.classLevelId
           });
        }
      } catch (err: any) {
        console.error(err);
        if (err.response?.status === 403) {
           setError('You are not assigned as a Class Teacher this session.');
        } else {
           setError('Failed to load class data.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchClassData();
  }, []);

  const studentColumns: Column<any>[] = [
    {
      header: 'Student Name',
      sortable: true,
      accessorKey: 'firstName',
      cell: (row) => <span className="font-medium text-text-primary">{row.firstName} {row.lastName}</span>
    },
    {
      header: 'Admission No',
      sortable: true,
      accessorKey: 'admissionNumber'
    },
    {
      header: 'Exams Taken',
      cell: (row) => {
         const count = attempts.filter(a => a.studentId === row.id && a.status === 'submitted').length;
         return count;
      }
    },
    {
      header: 'Actions',
      cell: (row) => (
         <button 
           onClick={(e) => { e.stopPropagation(); router.push(`/teacher/class/student/${row.id}`); }}
           className="text-sm font-medium text-brand-indigo hover:underline"
         >
           View Results
         </button>
      )
    }
  ];

  // Aggregate exams from attempts
  const examsMap = new Map<string, any>();
  attempts.forEach(a => {
     if (a.status !== 'submitted') return;
     if (!examsMap.has(a.examId)) {
        examsMap.set(a.examId, {
           examId: a.examId,
           title: a.exam.title,
           subject: a.exam.subject.name,
           totalQuestions: a.totalQuestions,
           totalScore: 0,
           count: 0
        });
     }
     const ex = examsMap.get(a.examId);
     ex.totalScore += (a.score || 0);
     ex.count += 1;
  });

  const examsAggregated = Array.from(examsMap.values()).map(ex => ({
     ...ex,
     averageScore: ex.totalScore / ex.count,
     averagePercentage: (ex.totalScore / ex.count) / ex.totalQuestions * 100
  }));

  const examColumns: Column<any>[] = [
    {
      header: 'Exam Title',
      sortable: true,
      accessorKey: 'title'
    },
    {
      header: 'Subject',
      sortable: true,
      accessorKey: 'subject'
    },
    {
      header: 'Students Taken',
      accessorKey: 'count',
      sortable: true
    },
    {
      header: 'Class Average',
      sortable: true,
      accessorKey: 'averagePercentage',
      cell: (row) => <span className="font-bold text-brand-indigo">{row.averagePercentage.toFixed(1)}%</span>
    }
  ];

  if (loading) {
    return (
      <DashboardLayout navItems={[{ name: 'My Class', href: '/teacher/class', icon: Users }]} title="My Class" role="Class Teacher">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-indigo" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout navItems={[{ name: 'Dashboard', href: '/teacher/dashboard', icon: FileText }, { name: 'My Class', href: '/teacher/class', icon: Users }]} title="My Class" role="Teacher">
         <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl mt-8 text-center max-w-2xl mx-auto shadow-sm">
            <Users className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Access Denied</h3>
            <p>{error}</p>
         </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      navItems={[
         { name: 'Dashboard', href: '/teacher/dashboard', icon: FileText },
         { name: 'My Class', href: '/teacher/class', icon: Users }
      ]} 
      title={classInfo ? `Class: ${classInfo.name}` : "My Class"} 
      role="Class Teacher"
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
         <p className="text-text-secondary text-sm">
            Manage your assigned class students and view aggregated academic performance.
         </p>
         <div className="mt-4 sm:mt-0">
            <ExportButton 
               url={`/results/class-teacher/export/class-results`}
               filename={`class_results_${classInfo?.name || 'export'}.xlsx`}
               label="Export Class Results"
            />
         </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
         <section>
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center">
               <Users className="w-5 h-5 mr-3 text-brand-emerald" />
               Students in My Class ({students.length})
            </h3>
            <ResultsTable 
               data={students} 
               columns={studentColumns} 
               emptyMessage="No students are enrolled in your class." 
               onRowClick={(row) => router.push(`/teacher/class/student/${row.id}`)}
            />
         </section>

         <section className="mt-4">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center">
               <BookOpen className="w-5 h-5 mr-3 text-brand-indigo" />
               Class Exam Performance
            </h3>
            <ResultsTable 
               data={examsAggregated} 
               columns={examColumns} 
               emptyMessage="Your class has not completed any exams yet." 
            />
         </section>
      </div>

    </DashboardLayout>
  );
}
