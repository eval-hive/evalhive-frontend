'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Eye, FileUp, GraduationCap, LockKeyhole, Search, UserCheck, UserX } from 'lucide-react';
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetSessionId, setTargetSessionId] = useState('');
  const [promoting, setPromoting] = useState(false);
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
  useEffect(() => { setSelectedIds([]); }, [filters.class_level_id, filters.session_id, filters.is_active, filters.search]);

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
      setSelectedIds([]);
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

  const selectedClass = classLevels.find(level => level.id === filters.class_level_id);
  const promotionMap: Record<string, string> = { JS1: 'JS2', JS2: 'JS3', JS3: 'SS1', SS1: 'SS2', SS2: 'SS3' };
  const destinationClassName = selectedClass ? promotionMap[selectedClass.name] : '';
  const isGraduation = selectedClass?.name === 'SS3';
  const canPromote = Boolean(filters.class_level_id && filters.session_id && selectedIds.length > 0 && (isGraduation || targetSessionId));
  const allVisibleSelected = students.length > 0 && students.every(student => selectedIds.includes(student.id));

  const toggleStudent = (studentId: string) => {
    setSelectedIds(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
  };

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds(prev => prev.filter(id => !students.some(student => student.id === id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...students.map(student => student.id)])));
    }
  };

  const promoteSelected = async () => {
    const actionLabel = isGraduation
      ? `graduate ${selectedIds.length} student(s) and disable their access`
      : `promote ${selectedIds.length} student(s) to ${destinationClassName}`;
    if (!window.confirm(`Confirm ${actionLabel}? Previous enrollment history will be preserved.`)) return;

    setPromoting(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/students/promote', {
        student_ids: selectedIds,
        source_class_level_id: filters.class_level_id,
        source_session_id: filters.session_id,
        target_session_id: isGraduation ? undefined : targetSessionId,
      });
      const summary = res.data.summary;
      setMessage(`Promotion complete. Promoted: ${summary.promoted}, Graduated: ${summary.graduated}, Skipped: ${summary.skipped}.`);
      setSelectedIds([]);
      loadStudents();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Promotion failed.');
    } finally {
      setPromoting(false);
    }
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

      {filters.class_level_id && filters.session_id && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Class Promotion</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {isGraduation
                  ? 'SS3 students will be graduated and their login access disabled.'
                  : destinationClassName
                    ? `Selected ${selectedClass?.name} students will move to ${destinationClassName}.`
                    : 'Choose a valid source class to preview the destination.'}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      className="h-4 w-4 rounded border-border text-brand-indigo"
                      aria-label="Select all visible students"
                    />
                  </th>
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
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="h-4 w-4 rounded border-border text-brand-indigo"
                        aria-label={`Select ${student.fullName}`}
                      />
                    </td>
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
