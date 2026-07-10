'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Lock, LockKeyhole, Pencil, Plus, Trash2, UserCheck, Users, UserX } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ExamStatusBadge from '@/components/ExamStatusBadge';
import api from '@/lib/api';

const navItems = [
  { name: 'Teachers', href: '/admin/school/teachers', icon: Users },
];

export default function TeacherProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [teacher, setTeacher] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showClassForm, setShowClassForm] = useState(false);
  const [deactivation, setDeactivation] = useState<any>(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', employee_id: '' });
  const [subjectForm, setSubjectForm] = useState({ subject_id: '', class_level_id: '', session_id: '' });
  const [classForm, setClassForm] = useState({ class_level_id: '', session_id: '' });
  const [reassignTeacherId, setReassignTeacherId] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadTeacher();
    Promise.all([
      api.get('/teachers', { params: { is_active: 'true', limit: 100 } }),
      api.get('/subjects'),
      api.get('/sessions/class-levels'),
      api.get('/sessions'),
    ]).then(([teacherRes, subjectRes, classRes, sessionRes]) => {
      setTeachers(teacherRes.data.teachers || []);
      setSubjects(subjectRes.data.subjects || []);
      setClassLevels(classRes.data.classLevels || []);
      setSessions(sessionRes.data.sessions || []);
    }).catch(() => setError('Could not load assignment options.'));
  }, [id]);

  const loadTeacher = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/teachers/${id}`);
      const nextTeacher = res.data.teacher;
      setTeacher(nextTeacher);
      setForm({
        first_name: nextTeacher.firstName || '',
        last_name: nextTeacher.lastName || '',
        employee_id: nextTeacher.employeeId || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load teacher.');
    } finally {
      setLoading(false);
    }
  };

  const saveTeacher = async () => {
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await api.put(`/teachers/${id}`, form);
      setIsEditing(false);
      setMessage('Teacher details updated.');
      loadTeacher();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not update teacher.');
    } finally {
      setActionLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!window.confirm(`Reset ${teacher.fullName}'s password to their email address?`)) return;
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post(`/teachers/${id}/reset-password`);
      setMessage('Password reset. Teacher must change it on next login.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Password reset failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const beginDeactivate = async () => {
    if (!window.confirm(`Deactivate ${teacher.fullName}? They will not be able to log in.`)) return;
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post(`/teachers/${id}/deactivate`);
      if (res.data.requiresReassignment) {
        setDeactivation(res.data);
        setActiveTab('exams');
        return;
      }
      setMessage('Teacher deactivated.');
      loadTeacher();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not deactivate teacher.');
    } finally {
      setActionLoading(false);
    }
  };

  const completeDeactivate = async (deactivateAnyway = false) => {
    if (!deactivateAnyway && !reassignTeacherId) {
      setError('Choose a teacher to receive active exams.');
      return;
    }
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post(`/teachers/${id}/deactivate`, deactivateAnyway ? { deactivateAnyway: true } : { reassignTeacherId });
      setDeactivation(null);
      setReassignTeacherId('');
      setMessage(deactivateAnyway ? 'Teacher deactivated. Active exams are now admin-owned.' : 'Active exams reassigned and teacher deactivated.');
      loadTeacher();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not complete deactivation.');
    } finally {
      setActionLoading(false);
    }
  };

  const reactivate = async () => {
    if (!window.confirm(`Reactivate ${teacher.fullName}?`)) return;
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post(`/teachers/${id}/reactivate`);
      setMessage('Teacher reactivated.');
      loadTeacher();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not reactivate teacher.');
    } finally {
      setActionLoading(false);
    }
  };

  const assignSubject = async () => {
    if (!subjectForm.subject_id || !subjectForm.class_level_id || !subjectForm.session_id) {
      setError('Choose subject, class level, and session.');
      return;
    }
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post(`/teachers/${id}/assign-subject`, subjectForm);
      setShowSubjectForm(false);
      setSubjectForm({ subject_id: '', class_level_id: '', session_id: '' });
      setMessage('Subject assignment saved.');
      loadTeacher();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not assign subject.');
    } finally {
      setActionLoading(false);
    }
  };

  const removeSubject = async (assignmentId: string) => {
    if (!window.confirm('Remove this subject assignment?')) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/teachers/${id}/subjects/${assignmentId}`);
      setMessage('Subject assignment removed.');
      loadTeacher();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not remove subject assignment.');
    }
  };

  const assignClassTeacher = async () => {
    if (!classForm.class_level_id || !classForm.session_id) {
      setError('Choose class level and session.');
      return;
    }
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post(`/teachers/${id}/assign-class-teacher`, classForm);
      setShowClassForm(false);
      setClassForm({ class_level_id: '', session_id: '' });
      setMessage('Class teacher assignment saved.');
      loadTeacher();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not assign class teacher.');
    } finally {
      setActionLoading(false);
    }
  };

  const removeClassTeacher = async () => {
    if (!window.confirm('Remove this class teacher assignment?')) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/teachers/${id}/class-teacher-assignment`);
      setMessage('Class teacher assignment removed.');
      loadTeacher();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not remove class teacher assignment.');
    }
  };

  if (loading || !teacher) {
    return (
      <DashboardLayout navItems={navItems} title="Teacher Profile" role="School Admin">
        <div className="py-12 text-center text-sm text-text-secondary">Loading teacher...</div>
      </DashboardLayout>
    );
  }

  const activeTeachers = teachers.filter(t => t.id !== teacher.id);

  return (
    <DashboardLayout navItems={navItems} title="Teacher Profile" role="School Admin">
      <button onClick={() => router.push('/admin/school/teachers')} className="mb-4 inline-flex items-center text-sm text-text-secondary hover:text-brand-indigo">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Teachers
      </button>

      {message && <div className="mb-4 rounded-lg border border-brand-emerald/30 bg-brand-emerald/10 p-3 text-sm text-brand-emerald">{message}</div>}
      {error && <div className="mb-4 rounded-lg border border-brand-red/30 bg-brand-red/10 p-3 text-sm text-brand-red">{error}</div>}

      <div className="mb-6 rounded-lg border border-border bg-card p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-text-primary">{teacher.fullName}</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${teacher.isActive ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-gray-100 text-text-secondary'}`}>
                {teacher.isActive ? 'Active' : 'Inactive'}
              </span>
              {teacher.isClassTeacher && <span className="rounded-full bg-brand-indigo/10 px-2.5 py-1 text-xs font-semibold text-brand-indigo">Class Teacher</span>}
            </div>
            <p className="mt-1 text-sm text-text-secondary">{teacher.email} | Employee ID: {teacher.employeeId || '-'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setIsEditing(!isEditing)} className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-gray-50">
              <Pencil className="mr-2 h-4 w-4" /> {isEditing ? 'Cancel Edit' : 'Edit'}
            </button>
            <button onClick={resetPassword} disabled={actionLoading} className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-gray-50">
              <LockKeyhole className="mr-2 h-4 w-4" /> Reset Password
            </button>
            {teacher.isActive ? (
              <button onClick={beginDeactivate} disabled={actionLoading} className="inline-flex items-center rounded-lg bg-brand-red px-3 py-2 text-sm font-medium text-white hover:bg-brand-red/90">
                <UserX className="mr-2 h-4 w-4" /> Deactivate
              </button>
            ) : (
              <button onClick={reactivate} disabled={actionLoading} className="inline-flex items-center rounded-lg bg-brand-emerald px-3 py-2 text-sm font-medium text-white hover:bg-brand-emerald/90">
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
              <label className="mb-1 block text-xs font-medium text-text-secondary">Employee ID</label>
              <input value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-text-secondary">Email <Lock className="h-3 w-3" /></label>
              <input value={teacher.email} disabled title="Email cannot be changed" className="w-full rounded-lg border border-border bg-gray-100 px-3 py-2 text-sm text-text-secondary" />
            </div>
            <div className="md:col-span-2">
              <button onClick={saveTeacher} disabled={actionLoading} className="rounded-lg bg-brand-indigo px-4 py-2 text-sm font-medium text-white hover:bg-brand-indigo/90">Save Changes</button>
            </div>
          </div>
        )}
      </div>

      {deactivation && (
        <div className="mb-6 rounded-lg border border-brand-red/30 bg-brand-red/5 p-5">
          <h3 className="font-semibold text-text-primary">Reassign active exams before deactivating</h3>
          <p className="mt-1 text-sm text-text-secondary">This teacher has {deactivation.unassigned_exams.length} active exam(s). Reassign them to another teacher, or deactivate anyway and make them admin-owned.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_auto_auto] md:items-center">
            <div className="rounded-lg border border-border bg-white p-3 text-sm text-text-secondary">
              {deactivation.unassigned_exams.map((exam: any) => (
                <div key={exam.id} className="py-1">{exam.title} - {exam.subject || 'No subject'} - {exam.status}</div>
              ))}
            </div>
            <select value={reassignTeacherId} onChange={e => setReassignTeacherId(e.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
              <option value="">Reassign all to...</option>
              {activeTeachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
            <button onClick={() => completeDeactivate(false)} disabled={actionLoading} className="rounded-lg bg-brand-indigo px-4 py-2 text-sm font-medium text-white hover:bg-brand-indigo/90">Reassign and Deactivate</button>
            <button onClick={() => completeDeactivate(true)} disabled={actionLoading} className="rounded-lg border border-brand-red/30 px-4 py-2 text-sm font-medium text-brand-red hover:bg-brand-red/10">Deactivate Anyway</button>
          </div>
        </div>
      )}

      <div className="mb-4 flex gap-2 border-b border-border">
        {['details', 'subjects', 'classAssignment', 'exams'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-semibold ${activeTab === tab ? 'border-b-2 border-brand-indigo text-brand-indigo' : 'text-text-secondary'}`}>
            {tab === 'details' ? 'Details' : tab === 'subjects' ? 'Subjects' : tab === 'classAssignment' ? 'Class Assignment' : 'Exams'}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div className="rounded-lg border border-border bg-card p-6">
          <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div><dt className="text-text-secondary">First Name</dt><dd className="font-medium text-text-primary">{teacher.firstName}</dd></div>
            <div><dt className="text-text-secondary">Last Name</dt><dd className="font-medium text-text-primary">{teacher.lastName}</dd></div>
            <div><dt className="text-text-secondary">Employee ID</dt><dd className="font-medium text-text-primary">{teacher.employeeId || '-'}</dd></div>
            <div><dt className="text-text-secondary">Email</dt><dd className="font-medium text-text-primary">{teacher.email}</dd></div>
            <div><dt className="text-text-secondary">Subject Assignments</dt><dd className="font-medium text-text-primary">{teacher.subjectsCount}</dd></div>
            <div><dt className="text-text-secondary">Login Status</dt><dd className="font-medium text-text-primary">{teacher.isActive ? 'Active' : 'Inactive'}</dd></div>
          </dl>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="font-semibold text-text-primary">Subject Assignments</h3>
            <button onClick={() => setShowSubjectForm(!showSubjectForm)} className="inline-flex items-center rounded-lg bg-brand-indigo px-3 py-2 text-sm font-medium text-white hover:bg-brand-indigo/90">
              <Plus className="mr-2 h-4 w-4" /> Assign Subject
            </button>
          </div>
          {showSubjectForm && (
            <div className="grid grid-cols-1 gap-3 border-b border-border bg-background p-4 md:grid-cols-4">
              <select value={subjectForm.subject_id} onChange={e => setSubjectForm({ ...subjectForm, subject_id: e.target.value })} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
                <option value="">Subject</option>
                {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
              <select value={subjectForm.class_level_id} onChange={e => setSubjectForm({ ...subjectForm, class_level_id: e.target.value })} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
                <option value="">Class Level</option>
                {classLevels.map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
              </select>
              <select value={subjectForm.session_id} onChange={e => setSubjectForm({ ...subjectForm, session_id: e.target.value })} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
                <option value="">Session</option>
                {sessions.map(session => <option key={session.id} value={session.id}>{session.name}</option>)}
              </select>
              <button onClick={assignSubject} disabled={actionLoading} className="rounded-lg bg-brand-emerald px-4 py-2 text-sm font-medium text-white hover:bg-brand-emerald/90">Save Assignment</button>
            </div>
          )}
          <div className="divide-y divide-border">
            {teacher.subjectAssignments?.length ? teacher.subjectAssignments.map((assignment: any) => (
              <div key={assignment.id} className="flex items-center justify-between px-6 py-4">
                <div className="text-sm">
                  <p className="font-medium text-text-primary">{assignment.subject?.name}</p>
                  <p className="text-text-secondary">{assignment.classLevel?.name} | {assignment.session?.name}</p>
                </div>
                <button onClick={() => removeSubject(assignment.id)} className="rounded-md p-1.5 text-text-secondary hover:bg-brand-red/10 hover:text-brand-red"><Trash2 className="h-4 w-4" /></button>
              </div>
            )) : <div className="p-10 text-center text-sm text-text-secondary">No subject assignments yet.</div>}
          </div>
        </div>
      )}

      {activeTab === 'classAssignment' && (
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="font-semibold text-text-primary">Class Teacher Assignment</h3>
            <button onClick={() => setShowClassForm(!showClassForm)} className="inline-flex items-center rounded-lg bg-brand-indigo px-3 py-2 text-sm font-medium text-white hover:bg-brand-indigo/90">
              <BookOpen className="mr-2 h-4 w-4" /> Assign Class
            </button>
          </div>
          {showClassForm && (
            <div className="grid grid-cols-1 gap-3 border-b border-border bg-background p-4 md:grid-cols-3">
              <select value={classForm.class_level_id} onChange={e => setClassForm({ ...classForm, class_level_id: e.target.value })} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
                <option value="">Class Level</option>
                {classLevels.map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
              </select>
              <select value={classForm.session_id} onChange={e => setClassForm({ ...classForm, session_id: e.target.value })} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
                <option value="">Session</option>
                {sessions.map(session => <option key={session.id} value={session.id}>{session.name}</option>)}
              </select>
              <button onClick={assignClassTeacher} disabled={actionLoading} className="rounded-lg bg-brand-emerald px-4 py-2 text-sm font-medium text-white hover:bg-brand-emerald/90">Save Assignment</button>
            </div>
          )}
          <div className="divide-y divide-border">
            {teacher.classTeacherAssignments?.length ? teacher.classTeacherAssignments.map((assignment: any) => (
              <div key={assignment.id} className="flex items-center justify-between px-6 py-4">
                <div className="text-sm">
                  <p className="font-medium text-text-primary">{assignment.classLevel?.name}</p>
                  <p className="text-text-secondary">{assignment.session?.name}</p>
                </div>
                <button onClick={removeClassTeacher} className="rounded-md p-1.5 text-text-secondary hover:bg-brand-red/10 hover:text-brand-red"><Trash2 className="h-4 w-4" /></button>
              </div>
            )) : <div className="p-10 text-center text-sm text-text-secondary">This teacher is not assigned as a class teacher.</div>}
          </div>
        </div>
      )}

      {activeTab === 'exams' && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {teacher.createdExams?.length ? teacher.createdExams.map((exam: any) => (
                <tr key={exam.id}>
                  <td className="px-6 py-4 text-sm font-medium text-text-primary">{exam.title}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{exam.subject?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{exam.classLevel?.name || '-'}</td>
                  <td className="px-6 py-4"><ExamStatusBadge status={exam.status} /></td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{exam.scheduledDate ? new Date(exam.scheduledDate).toLocaleDateString() : '-'}</td>
                </tr>
              )) : <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-text-secondary">No exams created by this teacher yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
