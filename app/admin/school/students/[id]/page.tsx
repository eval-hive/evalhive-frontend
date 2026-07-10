'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, GraduationCap, Lock, LockKeyhole, Pencil, RefreshCw, UserCheck, UserX } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';

const navItems = [
  { name: 'Students', href: '/admin/school/students', icon: GraduationCap },
];

export default function StudentProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '' });
  const [reassignForm, setReassignForm] = useState({ class_level_id: '', session_id: '' });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudent();
    Promise.all([api.get('/sessions/class-levels'), api.get('/sessions')])
      .then(([classRes, sessionRes]) => {
        setClassLevels(classRes.data.classLevels || []);
        setSessions(sessionRes.data.sessions || []);
      })
      .catch(() => setError('Could not load class options.'));
  }, [id]);

  const loadStudent = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/students/${id}`);
      const nextStudent = res.data.student;
      setStudent(nextStudent);
      setForm({ first_name: nextStudent.firstName || '', last_name: nextStudent.lastName || '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load student.');
    } finally {
      setLoading(false);
    }
  };

  const saveStudent = async () => {
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await api.put(`/students/${id}`, form);
      setIsEditing(false);
      setMessage('Student details updated.');
      loadStudent();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not update student.');
    } finally {
      setActionLoading(false);
    }
  };

  const runAction = async (action: 'deactivate' | 'reactivate' | 'reset-password') => {
    const prompts = {
      deactivate: `Deactivate ${student.fullName}? They will not be able to log in.`,
      reactivate: `Reactivate ${student.fullName}?`,
      'reset-password': `Reset ${student.fullName}'s password to their last name?`,
    };
    if (!window.confirm(prompts[action])) return;

    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post(`/students/${id}/${action}`);
      setMessage(action === 'reset-password' ? 'Password reset. Student must change it on next login.' : 'Student status updated.');
      loadStudent();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const reassignClass = async () => {
    if (!reassignForm.class_level_id || !reassignForm.session_id) {
      setError('Choose a class level and session.');
      return;
    }

    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post(`/students/${id}/reassign-class`, reassignForm);
      setShowReassign(false);
      setMessage('Class reassignment saved. Previous enrollment was preserved.');
      loadStudent();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not reassign class.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !student) {
    return (
      <DashboardLayout navItems={navItems} title="Student Profile" role="School Admin">
        <div className="py-12 text-center text-sm text-text-secondary">Loading student...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Student Profile" role="School Admin">
      <button onClick={() => router.push('/admin/school/students')} className="mb-4 inline-flex items-center text-sm text-text-secondary hover:text-brand-indigo">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Students
      </button>

      {message && <div className="mb-4 rounded-lg border border-brand-emerald/30 bg-brand-emerald/10 p-3 text-sm text-brand-emerald">{message}</div>}
      {error && <div className="mb-4 rounded-lg border border-brand-red/30 bg-brand-red/10 p-3 text-sm text-brand-red">{error}</div>}

      <div className="mb-6 rounded-lg border border-border bg-card p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-text-primary">{student.fullName}</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${student.isActive ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-gray-100 text-text-secondary'}`}>
                {student.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              {student.admissionNumber} | {student.classLevel?.name || 'No class'} | {student.session?.name || 'No session'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setIsEditing(!isEditing)} className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-gray-50">
              <Pencil className="mr-2 h-4 w-4" /> {isEditing ? 'Cancel Edit' : 'Edit'}
            </button>
            <button onClick={() => setShowReassign(!showReassign)} className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-gray-50">
              <RefreshCw className="mr-2 h-4 w-4" /> Reassign Class
            </button>
            <button onClick={() => runAction('reset-password')} disabled={actionLoading} className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-gray-50">
              <LockKeyhole className="mr-2 h-4 w-4" /> Reset Password
            </button>
            {student.isActive ? (
              <button onClick={() => runAction('deactivate')} disabled={actionLoading} className="inline-flex items-center rounded-lg bg-brand-red px-3 py-2 text-sm font-medium text-white hover:bg-brand-red/90">
                <UserX className="mr-2 h-4 w-4" /> Deactivate
              </button>
            ) : (
              <button onClick={() => runAction('reactivate')} disabled={actionLoading} className="inline-flex items-center rounded-lg bg-brand-emerald px-3 py-2 text-sm font-medium text-white hover:bg-brand-emerald/90">
                <UserCheck className="mr-2 h-4 w-4" /> Reactivate
              </button>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-border pt-5 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">First Name</label>
              <input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Last Name</label>
              <input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-text-secondary">Admission Number <Lock className="h-3 w-3" /></label>
              <input value={student.admissionNumber} disabled title="Admission number cannot be changed" className="w-full rounded-lg border border-border bg-gray-100 px-3 py-2 text-sm text-text-secondary" />
            </div>
            <div className="flex items-end">
              <button onClick={saveStudent} disabled={actionLoading} className="rounded-lg bg-brand-indigo px-4 py-2 text-sm font-medium text-white hover:bg-brand-indigo/90">Save Changes</button>
            </div>
          </div>
        )}

        {showReassign && (
          <div className="mt-5 rounded-lg border border-border bg-background p-4">
            <p className="mb-3 text-sm text-text-secondary">This creates a new enrollment record for the chosen session. Previous enrollment history is preserved.</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <select value={reassignForm.class_level_id} onChange={e => setReassignForm({ ...reassignForm, class_level_id: e.target.value })} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
                <option value="">Select Class Level</option>
                {classLevels.map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
              </select>
              <select value={reassignForm.session_id} onChange={e => setReassignForm({ ...reassignForm, session_id: e.target.value })} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
                <option value="">Select Session</option>
                {sessions.map(session => <option key={session.id} value={session.id}>{session.name}</option>)}
              </select>
              <button onClick={reassignClass} disabled={actionLoading} className="rounded-lg bg-brand-indigo px-4 py-2 text-sm font-medium text-white hover:bg-brand-indigo/90">Confirm Reassignment</button>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 flex gap-2 border-b border-border">
        {['details', 'examHistory', 'enrollments'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-semibold ${activeTab === tab ? 'border-b-2 border-brand-indigo text-brand-indigo' : 'text-text-secondary'}`}>
            {tab === 'details' ? 'Details' : tab === 'examHistory' ? 'Exam History' : 'Enrollments'}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div className="rounded-lg border border-border bg-card p-6">
          <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div><dt className="text-text-secondary">First Name</dt><dd className="font-medium text-text-primary">{student.firstName}</dd></div>
            <div><dt className="text-text-secondary">Last Name</dt><dd className="font-medium text-text-primary">{student.lastName}</dd></div>
            <div><dt className="text-text-secondary">Admission Number</dt><dd className="font-medium text-text-primary">{student.admissionNumber}</dd></div>
            <div><dt className="text-text-secondary">Current Class</dt><dd className="font-medium text-text-primary">{student.classLevel?.name || '-'}</dd></div>
            <div><dt className="text-text-secondary">Current Session</dt><dd className="font-medium text-text-primary">{student.session?.name || '-'}</dd></div>
            <div><dt className="text-text-secondary">Login Status</dt><dd className="font-medium text-text-primary">{student.isActive ? 'Active' : 'Inactive'}</dd></div>
          </dl>
        </div>
      )}

      {activeTab === 'examHistory' && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Exam</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {student.examAttempts?.length ? student.examAttempts.map((attempt: any) => (
                <tr key={attempt.id}>
                  <td className="px-6 py-4 text-sm text-text-primary">{attempt.examTitle}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{attempt.subject?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{attempt.score ?? '-'} / {attempt.totalQuestions ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : '-'}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-text-secondary">No exam attempts yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'enrollments' && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Class Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Session</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {student.enrollments?.map((enrollment: any) => (
                <tr key={enrollment.id}>
                  <td className="px-6 py-4 text-sm text-text-primary">{enrollment.classLevel?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{enrollment.session?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{new Date(enrollment.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
