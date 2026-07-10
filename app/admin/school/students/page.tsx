'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, FileUp, GraduationCap, LockKeyhole, RotateCcw, Search, UserCheck, UserX } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';

const navItems = [
  { name: 'Students', href: '/admin/school/students', icon: GraduationCap },
];

interface Student {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  isActive: boolean;
  classLevel: { name: string } | null;
  session: { name: string } | null;
}

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', class_level_id: '', session_id: '', is_active: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/sessions/class-levels'), api.get('/sessions')])
      .then(([classRes, sessionRes]) => {
        setClassLevels(classRes.data.classLevels || []);
        setSessions(sessionRes.data.sessions || []);
      })
      .catch(() => setError('Could not load filter options.'));
  }, []);

  useEffect(() => { loadStudents(1); }, [filters.class_level_id, filters.session_id, filters.is_active]);

  const loadStudents = async (page = pagination.page) => {
    setLoading(true);
    setError('');
    try {
      const params: any = { page, limit: 50 };
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const res = await api.get('/students', { params });
      setStudents(res.data.students || []);
      setPagination(res.data.pagination || { page, totalPages: 1, total: 0 });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load students.');
    } finally {
      setLoading(false);
    }
  };

  const runStudentAction = async (student: Student, action: 'deactivate' | 'reactivate' | 'reset-password') => {
    const prompts = {
      deactivate: `Deactivate ${student.fullName}? They will not be able to log in.`,
      reactivate: `Reactivate ${student.fullName}?`,
      'reset-password': `Reset ${student.fullName}'s password to their last name?`,
    };
    if (!window.confirm(prompts[action])) return;

    setError('');
    setMessage('');
    try {
      await api.post(`/students/${student.id}/${action}`);
      setMessage(action === 'reset-password' ? 'Password reset. Student must change it on next login.' : 'Student updated.');
      loadStudents();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Action failed.');
    }
  };

  const setFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <DashboardLayout navItems={navItems} title="Students" role="School Admin">
      {message && <div className="mb-4 rounded-lg border border-brand-emerald/30 bg-brand-emerald/10 p-3 text-sm text-brand-emerald">{message}</div>}
      {error && <div className="mb-4 rounded-lg border border-brand-red/30 bg-brand-red/10 p-3 text-sm text-brand-red">{error}</div>}

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative md:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
            <input
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadStudents(1)}
              placeholder="Name or admission no"
              className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-indigo"
            />
          </div>
          <select value={filters.class_level_id} onChange={e => setFilter('class_level_id', e.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
            <option value="">All Classes</option>
            {classLevels.map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
          </select>
          <select value={filters.session_id} onChange={e => setFilter('session_id', e.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
            <option value="">All Sessions</option>
            {sessions.map(session => <option key={session.id} value={session.id}>{session.name}</option>)}
          </select>
          <select value={filters.is_active} onChange={e => setFilter('is_active', e.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadStudents(1)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-gray-50">Search</button>
          <button onClick={() => router.push('/admin/school')} className="inline-flex items-center rounded-lg bg-brand-indigo px-4 py-2 text-sm font-medium text-white hover:bg-brand-indigo/90">
            <FileUp className="mr-2 h-4 w-4" /> Import Students
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
        {loading ? (
          <div className="p-12 text-center text-sm text-text-secondary">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-sm text-text-secondary">No students found for the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Admission No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Full Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Class Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Session</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">{student.admissionNumber}</td>
                    <td className="px-6 py-4 text-sm text-text-primary">{student.fullName}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{student.classLevel?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{student.session?.name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${student.isActive ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-gray-100 text-text-secondary'}`}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button title="View profile" onClick={() => router.push(`/admin/school/students/${student.id}`)} className="rounded-md p-1.5 text-text-secondary hover:bg-brand-indigo/10 hover:text-brand-indigo"><Eye className="h-4 w-4" /></button>
                        <button title="Reset password" onClick={() => runStudentAction(student, 'reset-password')} className="rounded-md p-1.5 text-text-secondary hover:bg-brand-indigo/10 hover:text-brand-indigo"><LockKeyhole className="h-4 w-4" /></button>
                        {student.isActive ? (
                          <button title="Deactivate" onClick={() => runStudentAction(student, 'deactivate')} className="rounded-md p-1.5 text-text-secondary hover:bg-brand-red/10 hover:text-brand-red"><UserX className="h-4 w-4" /></button>
                        ) : (
                          <button title="Reactivate" onClick={() => runStudentAction(student, 'reactivate')} className="rounded-md p-1.5 text-text-secondary hover:bg-brand-emerald/10 hover:text-brand-emerald"><UserCheck className="h-4 w-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
        <span>{pagination.total} student{pagination.total === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2">
          <button disabled={pagination.page <= 1} onClick={() => loadStudents(pagination.page - 1)} className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40">Previous</button>
          <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
          <button disabled={pagination.page >= pagination.totalPages} onClick={() => loadStudents(pagination.page + 1)} className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      </div>
    </DashboardLayout>
  );
}
