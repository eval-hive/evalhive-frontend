'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, FileUp, LockKeyhole, Search, UserCheck, UserPlus, Users, UserX } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import PeopleManagerDialog from '@/components/PeopleManagerDialog';
import api from '@/lib/api';

const navItems = [
  { name: 'Teachers', href: '/admin/school/teachers', icon: Users },
];

interface Teacher {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string | null;
  subjectsCount: number;
  isClassTeacher: boolean;
  isActive: boolean;
}

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', is_active: '', class_teacher: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [peopleDialog, setPeopleDialog] = useState<{ open: boolean; mode: 'single' | 'bulk' }>({ open: false, mode: 'single' });

  useEffect(() => { loadTeachers(1); }, [filters.is_active, filters.class_teacher]);

  const loadTeachers = async (page = pagination.page) => {
    setLoading(true);
    setError('');
    try {
      const params: any = { page, limit: 50 };
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const res = await api.get('/teachers', { params });
      setTeachers(res.data.teachers || []);
      setPagination(res.data.pagination || { page, totalPages: 1, total: 0 });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load teachers.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (teacher: Teacher) => {
    if (!window.confirm(`Reset ${teacher.fullName}'s password to their email address?`)) return;
    setError('');
    setMessage('');
    try {
      await api.post(`/teachers/${teacher.id}/reset-password`);
      setMessage('Password reset. Teacher must change it on next login.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Password reset failed.');
    }
  };

  const changeStatus = async (teacher: Teacher) => {
    if (!teacher.isActive) {
      if (!window.confirm(`Reactivate ${teacher.fullName}?`)) return;
      await api.post(`/teachers/${teacher.id}/reactivate`);
      setMessage('Teacher reactivated.');
      loadTeachers();
      return;
    }

    router.push(`/admin/school/teachers/${teacher.id}`);
  };

  const setFilter = (key: string, value: string) => setFilters(prev => ({ ...prev, [key]: value }));

  return (
    <DashboardLayout navItems={navItems} title="Teachers" role="School Admin">
      {message && <div className="mb-4 rounded-lg border border-brand-emerald/30 bg-brand-emerald/10 p-3 text-sm text-brand-emerald">{message}</div>}
      {error && <div className="mb-4 rounded-lg border border-brand-red/30 bg-brand-red/10 p-3 text-sm text-brand-red">{error}</div>}

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
            <input
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadTeachers(1)}
              placeholder="Name, email, or employee ID"
              className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-indigo"
            />
          </div>
          <select value={filters.is_active} onChange={e => setFilter('is_active', e.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select value={filters.class_teacher} onChange={e => setFilter('class_teacher', e.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
            <option value="">Class Teacher: All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => loadTeachers(1)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-gray-50">Search</button>
          <button onClick={() => setPeopleDialog({ open: true, mode: 'single' })} className="inline-flex items-center rounded-lg bg-brand-indigo px-4 py-2 text-sm font-medium text-white hover:bg-brand-indigo/90">
            <UserPlus className="mr-2 h-4 w-4" /> Add Teacher
          </button>
          <button onClick={() => setPeopleDialog({ open: true, mode: 'bulk' })} className="inline-flex items-center rounded-lg border border-brand-indigo px-4 py-2 text-sm font-medium text-brand-indigo hover:bg-brand-indigo/5">
            <FileUp className="mr-2 h-4 w-4" /> Import Teachers
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
        {loading ? (
          <div className="p-12 text-center text-sm text-text-secondary">Loading teachers...</div>
        ) : teachers.length === 0 ? (
          <div className="p-12 text-center text-sm text-text-secondary">No teachers found for the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Full Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Subjects</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Class Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {teachers.map(teacher => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">{teacher.fullName}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{teacher.email}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{teacher.subjectsCount}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{teacher.isClassTeacher ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${teacher.isActive ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-gray-100 text-text-secondary'}`}>
                        {teacher.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button title="View profile" onClick={() => router.push(`/admin/school/teachers/${teacher.id}`)} className="rounded-md p-1.5 text-text-secondary hover:bg-brand-indigo/10 hover:text-brand-indigo"><Eye className="h-4 w-4" /></button>
                        <button title="Reset password" onClick={() => resetPassword(teacher)} className="rounded-md p-1.5 text-text-secondary hover:bg-brand-indigo/10 hover:text-brand-indigo"><LockKeyhole className="h-4 w-4" /></button>
                        {teacher.isActive ? (
                          <button title="Deactivate from profile" onClick={() => changeStatus(teacher)} className="rounded-md p-1.5 text-text-secondary hover:bg-brand-red/10 hover:text-brand-red"><UserX className="h-4 w-4" /></button>
                        ) : (
                          <button title="Reactivate" onClick={() => changeStatus(teacher)} className="rounded-md p-1.5 text-text-secondary hover:bg-brand-emerald/10 hover:text-brand-emerald"><UserCheck className="h-4 w-4" /></button>
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
        <span>{pagination.total} teacher{pagination.total === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2">
          <button disabled={pagination.page <= 1} onClick={() => loadTeachers(pagination.page - 1)} className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40">Previous</button>
          <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
          <button disabled={pagination.page >= pagination.totalPages} onClick={() => loadTeachers(pagination.page + 1)} className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      </div>

      <PeopleManagerDialog
        open={peopleDialog.open}
        type="teacher"
        initialMode={peopleDialog.mode}
        onClose={() => setPeopleDialog(current => ({ ...current, open: false }))}
        onComplete={successMessage => {
          setMessage(successMessage);
          loadTeachers(1);
        }}
      />
    </DashboardLayout>
  );
}
