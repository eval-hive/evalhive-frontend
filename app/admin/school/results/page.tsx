'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { FileSpreadsheet, Loader2, Search, FilterX } from 'lucide-react';
import api from '@/lib/api';
import ResultsTable, { Column } from '@/components/ResultsTable';
import ExportButton from '@/components/ExportButton';

export default function AdminSchoolResults() {
  const router = useRouter();
  
  // Data
  const [attempts, setAttempts] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filters, setFilters] = useState({
    sessionId: '',
    termId: '',
    classLevelId: ''
  });

  const fetchFiltersInfo = async () => {
    try {
      // Best effort filter population
      const [sessRes, classRes] = await Promise.all([
        api.get('/sessions'),
        api.get('/sessions/class-levels').catch(() => ({ data: { classLevels: [] } }))
      ]);
      setSessions(sessRes.data.sessions || []);
      setClassLevels(classRes.data.classLevels || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (filters.sessionId) {
      api.get(`/sessions/${filters.sessionId}/terms`)
         .then(res => setTerms(res.data.terms || []))
         .catch(e => console.error(e));
    } else {
      setTerms([]);
      setFilters(prev => ({...prev, termId: ''}));
    }
  }, [filters.sessionId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.sessionId) queryParams.append('sessionId', filters.sessionId);
      if (filters.termId) queryParams.append('termId', filters.termId);
      if (filters.classLevelId) queryParams.append('classLevelId', filters.classLevelId);
      
      const res = await api.get(`/results/admin/results?${queryParams.toString()}`);
      setAttempts(res.data.attempts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersInfo().then(() => loadResults());
  }, []); // Load once initially

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    loadResults();
  };
  
  const handleClearFilters = () => {
    setFilters({ sessionId: '', termId: '', classLevelId: '' });
    // setTimeout to allow state update before loading
    setTimeout(() => {
       loadResults();
    }, 100);
  };

  const columns: Column<any>[] = [
    {
      header: 'Student Name',
      sortable: true,
      accessorKey: 'studentName',
      cell: (row) => `${row.student.firstName} ${row.student.lastName}`
    },
    {
      header: 'Admission No',
      sortable: true,
      accessorKey: 'adminNo',
      cell: (row) => row.student.admissionNumber
    },
    {
      header: 'Class',
      sortable: true,
      accessorKey: 'class',
      cell: (row) => row.exam?.classLevel?.name || '-'
    },
    {
      header: 'Exam',
      sortable: true,
      accessorKey: 'exam',
      cell: (row) => row.exam?.title || '-'
    },
    {
      header: 'Subject',
      sortable: true,
      accessorKey: 'subject',
      cell: (row) => row.exam?.subject?.name || '-'
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
      accessorKey: 'percentage',
      cell: (row) => {
         const pct = row.totalQuestions > 0 ? (row.score / row.totalQuestions) * 100 : 0;
         return `${pct.toFixed(1)}%`;
      }
    }
  ];

  const canExport = filters.sessionId && filters.classLevelId && filters.termId;

  return (
    <DashboardLayout 
      navItems={[
        { name: 'School Dashboard', href: '/admin/school', icon: FileSpreadsheet },
        { name: 'Results', href: '/admin/school/results', icon: FileSpreadsheet },
      ]} 
      title="Platform Results" 
      role="School Admin"
    >
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Filter Results</h2>
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col md:flex-row items-end gap-4">
          
          <div className="w-full md:w-1/4">
            <label className="block text-sm font-medium text-text-secondary mb-1">Session</label>
            <select 
              value={filters.sessionId} 
              onChange={(e) => handleFilterChange('sessionId', e.target.value)}
              className="w-full border-border rounded-md shadow-sm p-2 text-sm focus:border-brand-indigo focus:ring-brand-indigo"
            >
              <option value="">All Sessions</option>
              {sessions.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/4">
            <label className="block text-sm font-medium text-text-secondary mb-1">Term</label>
            <select 
              value={filters.termId} 
              onChange={(e) => handleFilterChange('termId', e.target.value)}
              disabled={!filters.sessionId}
              className="w-full border-border rounded-md shadow-sm p-2 text-sm focus:border-brand-indigo focus:ring-brand-indigo disabled:opacity-50"
            >
              <option value="">All Terms</option>
              {terms.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/4">
            <label className="block text-sm font-medium text-text-secondary mb-1">Class Level</label>
            <select 
              value={filters.classLevelId} 
              onChange={(e) => handleFilterChange('classLevelId', e.target.value)}
              className="w-full border-border rounded-md shadow-sm p-2 text-sm focus:border-brand-indigo focus:ring-brand-indigo"
            >
              <option value="">All Classes</option>
              {classLevels.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-brand-indigo text-white rounded-md text-sm font-medium shadow-sm hover:bg-brand-indigo/90 focus:outline-none w-full md:w-auto flex items-center justify-center"
            >
              <Search className="w-4 h-4 mr-2" />
              Apply
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-100 text-text-secondary rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none w-full md:w-auto flex items-center justify-center"
            >
               <FilterX className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
         <p className="text-sm text-text-secondary">
           Click on any result row to view the full exam analysis.
         </p>
         {canExport && (
            <ExportButton 
              url={`/results/admin/export/class-results?session_id=${filters.sessionId}&term_id=${filters.termId}&class_level_id=${filters.classLevelId}`}
              filename="class_results.xlsx"
              label="Export Class Excel"
              className="mt-4 sm:mt-0"
            />
         )}
         {!canExport && (
            <div className="mt-4 sm:mt-0 text-xs text-text-secondary italic">
               Select Session, Term and Class Level to export Excel results.
            </div>
         )}
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
           <Loader2 className="w-8 h-8 animate-spin text-brand-indigo" />
        </div>
      ) : (
        <ResultsTable 
          data={attempts} 
          columns={columns} 
          emptyMessage="No results found for these filters." 
          onRowClick={(row) => router.push(`/admin/school/results/exam/${row.examId}`)}
        />
      )}
    </DashboardLayout>
  );
}
