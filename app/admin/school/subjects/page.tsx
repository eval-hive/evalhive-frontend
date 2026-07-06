'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, BookOpen, Users } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';

const navItems = [
  { name: 'School Dashboard', href: '/admin/school', icon: BookOpen },
  { name: 'Subjects', href: '/admin/school/subjects', icon: BookOpen },
  { name: 'Exams', href: '/admin/school/exams', icon: BookOpen },
];

interface Subject { id: string; name: string; }
interface Teacher { id: string; firstName: string; lastName: string; }
interface ClassLevel { id: string; name: string; }
interface Session { id: string; name: string; }

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');
  const [assignForm, setAssignForm] = useState({ teacherId: '', subjectId: '', classLevelId: '', sessionId: '' });
  const [showAssign, setShowAssign] = useState(false);

  useEffect(() => {
    loadSubjects();
    loadTeachers();
    loadClassLevels();
    loadSessions();
  }, []);

  const loadSubjects = async () => {
    try { const res = await api.get('/subjects'); setSubjects(res.data.subjects); } catch (e) { console.error(e); }
  };
  const loadTeachers = async () => {
    try { const res = await api.get('/teachers'); setTeachers(res.data.teachers || []); } catch (e) { console.error(e); }
  };
  const loadClassLevels = async () => {
    try { const res = await api.get('/sessions/class-levels'); setClassLevels(res.data.classLevels || []); } catch (e) { console.error(e); }
  };
  const loadSessions = async () => {
    try { const res = await api.get('/sessions'); setSessions(res.data.sessions || []); } catch (e) { console.error(e); }
  };

  const createSubject = async () => {
    setError('');
    if (!newSubjectName.trim()) return;
    try {
      await api.post('/subjects', { name: newSubjectName });
      setNewSubjectName('');
      loadSubjects();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to create subject');
    }
  };

  const updateSubject = async (id: string) => {
    setError('');
    if (!editName.trim()) return;
    try {
      await api.put(`/subjects/${id}`, { name: editName });
      setEditingId(null);
      loadSubjects();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to update subject');
    }
  };

  const assignTeacher = async () => {
    setError('');
    const { teacherId, subjectId, classLevelId, sessionId } = assignForm;
    if (!teacherId || !subjectId || !classLevelId || !sessionId) {
      setError('All fields are required');
      return;
    }
    try {
      await api.post(`/subjects/${teacherId}/assign`, { subjectId, classLevelId, sessionId });
      setShowAssign(false);
      setAssignForm({ teacherId: '', subjectId: '', classLevelId: '', sessionId: '' });
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to assign teacher');
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Subjects" role="School Admin">
      {error && (
        <div className="mb-4 bg-brand-red/10 border-l-4 border-brand-red p-3 rounded-md text-sm text-brand-red">{error}</div>
      )}

      {/* Create Subject */}
      <div className="bg-card rounded-lg border border-border p-6 mb-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Add Subject</h2>
        <div className="flex gap-3">
          <input
            type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)}
            placeholder="e.g. Mathematics" onKeyDown={(e) => e.key === 'Enter' && createSubject()}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-indigo focus:border-brand-indigo bg-background"
          />
          <button onClick={createSubject}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand-indigo hover:bg-brand-indigo/90 transition-colors">
            <Plus className="h-4 w-4 mr-2" /> Add
          </button>
        </div>
      </div>

      {/* Subject List */}
      <div className="bg-card rounded-lg border border-border shadow-[0_1px_2px_rgba(17,24,39,0.04)] overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Subjects ({subjects.length})</h2>
          <button onClick={() => setShowAssign(!showAssign)}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-brand-indigo bg-brand-indigo/10 hover:bg-brand-indigo/20 transition-colors">
            <Users className="h-3.5 w-3.5 mr-1" /> Assign Teacher
          </button>
        </div>

        {subjects.length === 0 ? (
          <div className="p-12 text-center text-text-secondary text-sm">No subjects yet. Add one above.</div>
        ) : (
          <ul className="divide-y divide-border">
            {subjects.map((s) => (
              <li key={s.id} className="px-6 py-3 flex items-center justify-between">
                {editingId === s.id ? (
                  <div className="flex gap-2 flex-1">
                    <input value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand-indigo bg-background"
                      onKeyDown={(e) => e.key === 'Enter' && updateSubject(s.id)} autoFocus
                    />
                    <button onClick={() => updateSubject(s.id)} className="px-3 py-1.5 text-xs font-medium rounded-md text-white bg-brand-indigo">Save</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-medium rounded-md text-text-secondary border border-border">Cancel</button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-medium text-text-primary">{s.name}</span>
                    <button onClick={() => { setEditingId(s.id); setEditName(s.name); }}
                      className="p-1.5 rounded-md text-text-secondary hover:text-brand-indigo hover:bg-brand-indigo/10 transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Assign Teacher Modal */}
      {showAssign && (
        <div className="mt-6 bg-card rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <h3 className="text-md font-semibold text-text-primary mb-4">Assign Subject to Teacher</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select value={assignForm.teacherId} onChange={(e) => setAssignForm({...assignForm, teacherId: e.target.value})}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background">
              <option value="">Select Teacher</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
            </select>
            <select value={assignForm.subjectId} onChange={(e) => setAssignForm({...assignForm, subjectId: e.target.value})}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background">
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={assignForm.classLevelId} onChange={(e) => setAssignForm({...assignForm, classLevelId: e.target.value})}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background">
              <option value="">Select Class Level</option>
              {classLevels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={assignForm.sessionId} onChange={(e) => setAssignForm({...assignForm, sessionId: e.target.value})}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background">
              <option value="">Select Session</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={assignTeacher}
              className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand-emerald hover:bg-brand-emerald/90 transition-colors">
              Assign
            </button>
            <button onClick={() => setShowAssign(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg text-text-secondary border border-border hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
