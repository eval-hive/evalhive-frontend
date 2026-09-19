'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CalendarDays, Check, Loader2, Plus } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';

const navItems = [
  { name: 'Academic Sessions', href: '/admin/school/sessions', icon: CalendarDays },
];

type TermName = 'first' | 'second' | 'third';

interface Term {
  id: string;
  name: TermName;
}

interface AcademicSession {
  id: string;
  name: string;
  isActive: boolean;
  terms: Term[];
}

const termNames: TermName[] = ['first', 'second', 'third'];
const formatTerm = (term: TermName) => `${term.charAt(0).toUpperCase()}${term.slice(1)} Term`;

export default function AcademicSessionsPage() {
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [name, setName] = useState('');
  const [makeActive, setMakeActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadSessions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sessions');
      setSessions(response.data.sessions || []);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || 'Could not load academic sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSessions(); }, []);

  const createSession = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError('');
    setMessage('');
    try {
      await api.post('/sessions', { name, make_active: makeActive });
      setName('');
      setMessage(`${name} academic session created${makeActive ? ' and set as active' : ''}.`);
      await loadSessions();
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || 'Could not create the academic session.');
    } finally {
      setCreating(false);
    }
  };

  const activateSession = async (session: AcademicSession) => {
    if (!window.confirm(`Make ${session.name} the active academic session?`)) return;
    setBusyAction(`activate-${session.id}`);
    setError('');
    setMessage('');
    try {
      await api.post(`/sessions/${session.id}/activate`);
      setMessage(`${session.name} is now the active academic session.`);
      await loadSessions();
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || 'Could not activate the session.');
    } finally {
      setBusyAction('');
    }
  };

  const addTerm = async (session: AcademicSession, term: TermName) => {
    const actionKey = `${session.id}-${term}`;
    setBusyAction(actionKey);
    setError('');
    setMessage('');
    try {
      await api.post(`/sessions/${session.id}/terms`, { name: term });
      setMessage(`${formatTerm(term)} added to ${session.name}.`);
      await loadSessions();
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || 'Could not add the term.');
    } finally {
      setBusyAction('');
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Academic Sessions" role="School Admin">
      {message && <div className="mb-5 rounded-lg border border-brand-emerald/30 bg-brand-emerald/10 p-3 text-sm text-brand-emerald">{message}</div>}
      {error && <div className="mb-5 rounded-lg border border-brand-red/30 bg-brand-red/10 p-3 text-sm text-brand-red">{error}</div>}

      <div className="mb-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">School calendar</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
            Sessions keep enrollments, class assignments, exams, and results organised by academic year. Only one session can be active at a time.
          </p>
        </div>

        <form onSubmit={createSession} className="rounded-lg border border-border bg-card p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <h3 className="text-sm font-semibold text-text-primary">Add academic session</h3>
          <label className="mt-4 block text-sm font-medium text-text-primary">
            Session year
            <input
              required
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="2026/2027"
              pattern="\d{4}/\d{4}"
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 font-normal outline-none focus:border-brand-indigo"
            />
          </label>
          <label className="mt-4 flex items-start gap-3 text-sm text-text-secondary">
            <input type="checkbox" checked={makeActive} onChange={event => setMakeActive(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border text-brand-indigo" />
            <span>Make this the active session immediately</span>
          </label>
          <button disabled={creating} className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-brand-indigo px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Create Session
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold text-text-primary">Academic sessions</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-12 text-sm text-text-secondary"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-text-secondary" />
            <p className="mt-3 text-sm font-medium text-text-primary">No academic sessions yet</p>
            <p className="mt-1 text-sm text-text-secondary">Create the school&apos;s first academic session above.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sessions.map(session => (
              <div key={session.id} className="px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${session.isActive ? 'bg-brand-indigo/10 text-brand-indigo' : 'bg-gray-100 text-text-secondary'}`}>
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-text-primary">{session.name}</h3>
                        {session.isActive && <span className="rounded-full bg-brand-emerald/10 px-2.5 py-1 text-xs font-semibold text-brand-emerald">Active</span>}
                      </div>
                      <p className="mt-1 text-xs text-text-secondary">{session.terms.length} of 3 terms configured</p>
                    </div>
                  </div>
                  {!session.isActive && (
                    <button onClick={() => activateSession(session)} disabled={busyAction === `activate-${session.id}`} className="inline-flex items-center justify-center rounded-lg border border-brand-indigo px-3 py-2 text-sm font-medium text-brand-indigo hover:bg-brand-indigo/5 disabled:opacity-60">
                      {busyAction === `activate-${session.id}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />} Set Active
                    </button>
                  )}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {termNames.map(termName => {
                    const exists = session.terms.some(term => term.name === termName);
                    const actionKey = `${session.id}-${termName}`;
                    return exists ? (
                      <div key={termName} className="flex items-center rounded-lg border border-brand-emerald/20 bg-brand-emerald/5 px-3 py-2 text-sm text-text-primary">
                        <Check className="mr-2 h-4 w-4 text-brand-emerald" /> {formatTerm(termName)}
                      </div>
                    ) : (
                      <button key={termName} onClick={() => addTerm(session, termName)} disabled={Boolean(busyAction)} className="inline-flex items-center rounded-lg border border-dashed border-border px-3 py-2 text-sm text-text-secondary hover:border-brand-indigo/40 hover:text-brand-indigo disabled:opacity-50">
                        {busyAction === actionKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Add {formatTerm(termName)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
