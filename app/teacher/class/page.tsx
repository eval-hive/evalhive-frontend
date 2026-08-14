'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { ArrowUpRight, Users, Loader2, BookOpen, FileText } from 'lucide-react';
import api from '@/lib/api';
import ResultsTable, { Column } from '@/components/ResultsTable';
import ExportButton from '@/components/ExportButton';

export default function ClassTeacherPage() {
  const router = useRouter();
  
  const [students, setStudents] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetSessionId, setTargetSessionId] = useState('');
  const [classInfo, setClassInfo] = useState<{name: string, sessionId: string, classLevelId: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchClassData = async () => {
    try {
      setError(null);
      const [studentsRes, resultsRes, sessionsRes] = await Promise.all([
        api.get('/results/class-teacher/students'),
        api.get('/results/class-teacher/class-results'),
        api.get('/sessions'),
      ]);

      setStudents(studentsRes.data.students || []);
      setAttempts(resultsRes.data.attempts || []);
      setSessions(sessionsRes.data.sessions || []);
      setSelectedIds([]);

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

  useEffect(() => {
    fetchClassData();
  }, []);

  const promotionMap: Record<string, string> = { JS1: 'JS2', JS2: 'JS3', JS3: 'SS1', SS1: 'SS2', SS2: 'SS3' };
  const destinationClassName = classInfo ? promotionMap[classInfo.name] : '';
  const isGraduation = classInfo?.name === 'SS3';
  const canPromote = Boolean(classInfo && selectedIds.length > 0 && (isGraduation || targetSessionId));
  const allVisibleSelected = students.length > 0 && students.every(student => selectedIds.includes(student.id));

  const toggleStudent = (studentId: string) => {
    setSelectedIds(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
  };

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map(student => student.id));
    }
  };

  const promoteSelected = async () => {
    if (!classInfo) return;
    const actionLabel = isGraduation
      ? `graduate ${selectedIds.length} student(s) and disable their access`
      : `promote ${selectedIds.length} student(s) to ${destinationClassName}`;
    if (!window.confirm(`Confirm ${actionLabel}? Previous enrollment history will be preserved.`)) return;

    setPromoting(true);
    setError(null);
    setMessage('');
    try {
      const res = await api.post('/students/promote', {
        student_ids: selectedIds,
        source_class_level_id: classInfo.classLevelId,
        source_session_id: classInfo.sessionId,
        target_session_id: isGraduation ? undefined : targetSessionId,
      });
      const summary = res.data.summary;
      setMessage(`Promotion complete. Promoted: ${summary.promoted}, Graduated: ${summary.graduated}, Skipped: ${summary.skipped}.`);
      await fetchClassData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Promotion failed.');
    } finally {
      setPromoting(false);
    }
  };

  const studentColumns: Column<any>[] = [
    {
      header: '',
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={(e) => { e.stopPropagation(); toggleStudent(row.id); }}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-border text-brand-indigo"
          aria-label={`Select ${row.firstName} ${row.lastName}`}
        />
      )
    },
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
         <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg mt-8 text-center max-w-2xl mx-auto shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
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
      {message && <div className="mb-4 rounded-lg border border-brand-emerald/30 bg-brand-emerald/10 p-3 text-sm text-brand-emerald">{message}</div>}

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

      {classInfo && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Class Promotion</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {isGraduation
                  ? 'SS3 students will be graduated and their login access disabled.'
                  : destinationClassName
                    ? `Selected ${classInfo.name} students will move to ${destinationClassName}.`
                    : 'This class has no promotion destination.'}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button onClick={toggleAllVisible} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-gray-50">
                {allVisibleSelected ? 'Clear Selection' : 'Select All'}
              </button>
              {!isGraduation && (
                <select value={targetSessionId} onChange={e => setTargetSessionId(e.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
                  <option value="">Target Session</option>
                  {sessions.map(session => <option key={session.id} value={session.id}>{session.name}</option>)}
                </select>
              )}
              <button
                onClick={promoteSelected}
                disabled={!canPromote || promoting}
                className="inline-flex items-center justify-center rounded-lg bg-brand-indigo px-4 py-2 text-sm font-medium text-white hover:bg-brand-indigo/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />
                {isGraduation ? 'Graduate Selected' : 'Promote Selected'} ({selectedIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

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
