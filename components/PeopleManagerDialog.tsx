'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
  UserPlus,
  X,
} from 'lucide-react';
import api from '@/lib/api';

type PersonType = 'student' | 'teacher';

interface Option {
  id: string;
  name: string;
  isActive?: boolean;
}

interface ImportError {
  row: number;
  reason: string;
}

interface ImportSummary {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
}

interface PeopleManagerDialogProps {
  open: boolean;
  type: PersonType;
  classLevels?: Option[];
  sessions?: Option[];
  initialMode?: 'single' | 'bulk';
  onClose: () => void;
  onComplete: (message: string) => void;
}

const initialForm = {
  first_name: '',
  last_name: '',
  admission_number: '',
  class_level_id: '',
  session_id: '',
  email: '',
  employee_id: '',
};

const emptyOptions: Option[] = [];

export default function PeopleManagerDialog({
  open,
  type,
  classLevels = emptyOptions,
  sessions = emptyOptions,
  initialMode = 'single',
  onClose,
  onComplete,
}: PeopleManagerDialogProps) {
  const [mode, setMode] = useState<'single' | 'bulk'>(initialMode);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [importSessionId, setImportSessionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [rowErrors, setRowErrors] = useState<ImportError[]>([]);

  const plural = type === 'student' ? 'students' : 'teachers';
  const label = type === 'student' ? 'Student' : 'Teacher';

  useEffect(() => {
    if (!open) return;
    const activeSession = sessions.find(session => session.isActive) || sessions[0];
    setMode(initialMode);
    setForm({ ...initialForm, session_id: activeSession?.id || '' });
    setImportSessionId(activeSession?.id || '');
    setFile(null);
    setError('');
    setSummary(null);
    setRowErrors([]);
  }, [open, initialMode, sessions]);

  if (!open) return null;

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const submitSingle = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/${plural}`, form);
      onComplete(`${label} added successfully. Their temporary password is ${type === 'student' ? 'their last name' : 'their email address'}.`);
      onClose();
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || `Could not add ${label.toLowerCase()}.`);
    } finally {
      setSubmitting(false);
    }
  };

  const submitImport = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError('Choose a CSV or XLSX file to import.');
      return;
    }
    if (type === 'student' && !importSessionId) {
      setError('Choose the academic session for these students.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSummary(null);
    setRowErrors([]);
    try {
      const payload = new FormData();
      payload.append('file', file);
      if (type === 'student') payload.append('session_id', importSessionId);
      const response = await api.post(`/${plural}/import`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSummary(response.data.summary);
      setRowErrors(response.data.errors || []);
      if (response.data.summary.errorCount === 0) {
        onComplete(`${response.data.summary.successCount} ${plural} imported successfully.`);
      }
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || `Could not import ${plural}.`);
    } finally {
      setSubmitting(false);
    }
  };

  const downloadTemplate = async (format: 'csv' | 'xlsx') => {
    setDownloading(format);
    setError('');
    try {
      const response = await api.get(`/${plural}/import-template`, {
        params: { format },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${plural}_import_template.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || 'Could not download the template.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="people-dialog-title">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <h2 id="people-dialog-title" className="text-xl font-semibold text-text-primary">Manage {plural}</h2>
            <p className="mt-1 text-sm text-text-secondary">Add one person or import several from a spreadsheet.</p>
          </div>
          <button onClick={onClose} className="rounded-md p-2 text-text-secondary hover:bg-gray-100" aria-label="Close dialog">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-border px-6 pt-4">
          <div className="flex gap-6">
            <button onClick={() => { setMode('single'); setError(''); }} className={`border-b-2 px-1 pb-3 text-sm font-medium ${mode === 'single' ? 'border-brand-indigo text-brand-indigo' : 'border-transparent text-text-secondary'}`}>
              <UserPlus className="mr-2 inline h-4 w-4" /> Add one
            </button>
            <button onClick={() => { setMode('bulk'); setError(''); }} className={`border-b-2 px-1 pb-3 text-sm font-medium ${mode === 'bulk' ? 'border-brand-indigo text-brand-indigo' : 'border-transparent text-text-secondary'}`}>
              <UploadCloud className="mr-2 inline h-4 w-4" /> Bulk import
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && <div className="mb-5 flex gap-2 rounded-lg border border-brand-red/30 bg-brand-red/10 p-3 text-sm text-brand-red"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

          {mode === 'single' ? (
            <form onSubmit={submitSingle} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-text-primary">First name
                  <input required value={form.first_name} onChange={event => updateField('first_name', event.target.value)} className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 font-normal outline-none focus:border-brand-indigo" />
                </label>
                <label className="text-sm font-medium text-text-primary">Last name
                  <input required value={form.last_name} onChange={event => updateField('last_name', event.target.value)} className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 font-normal outline-none focus:border-brand-indigo" />
                </label>
                {type === 'student' ? (
                  <>
                    <label className="text-sm font-medium text-text-primary">Admission number
                      <input required value={form.admission_number} onChange={event => updateField('admission_number', event.target.value)} className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 font-normal outline-none focus:border-brand-indigo" />
                    </label>
                    <label className="text-sm font-medium text-text-primary">Class
                      <select required value={form.class_level_id} onChange={event => updateField('class_level_id', event.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2.5 font-normal">
                        <option value="">Select class</option>
                        {classLevels.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                    </label>
                    <label className="text-sm font-medium text-text-primary sm:col-span-2">Academic session
                      <select required value={form.session_id} onChange={event => updateField('session_id', event.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2.5 font-normal">
                        <option value="">Select session</option>
                        {sessions.map(item => <option key={item.id} value={item.id}>{item.name}{item.isActive ? ' (Active)' : ''}</option>)}
                      </select>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="text-sm font-medium text-text-primary">Email address
                      <input required type="email" value={form.email} onChange={event => updateField('email', event.target.value)} className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 font-normal outline-none focus:border-brand-indigo" />
                    </label>
                    <label className="text-sm font-medium text-text-primary">Employee ID <span className="font-normal text-text-secondary">(optional)</span>
                      <input value={form.employee_id} onChange={event => updateField('employee_id', event.target.value)} className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 font-normal outline-none focus:border-brand-indigo" />
                    </label>
                  </>
                )}
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-sm text-text-secondary">
                The temporary password will be {type === 'student' ? "the student's last name in lowercase" : "the teacher's email address"}. They must change it after signing in.
              </div>
              <div className="flex justify-end gap-3 border-t border-border pt-5">
                <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-gray-50">Cancel</button>
                <button disabled={submitting} className="inline-flex items-center rounded-lg bg-brand-indigo px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />} Add {label}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={submitImport} className="space-y-5">
              <div className="rounded-lg border border-border bg-gray-50 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">Start with the template</h3>
                    <p className="mt-1 text-sm text-text-secondary">Keep the column names unchanged. Replace the sample row with your records.</p>
                  </div>
                  <div className="flex gap-2">
                    {(['csv', 'xlsx'] as const).map(format => (
                      <button key={format} type="button" onClick={() => downloadTemplate(format)} disabled={downloading !== null} className="inline-flex items-center rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold uppercase text-brand-indigo hover:border-brand-indigo/40 disabled:opacity-60">
                        {downloading === format ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}{format}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {type === 'student' && (
                <label className="block text-sm font-medium text-text-primary">Academic session for this import
                  <select required value={importSessionId} onChange={event => setImportSessionId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2.5 font-normal">
                    <option value="">Select session</option>
                    {sessions.map(item => <option key={item.id} value={item.id}>{item.name}{item.isActive ? ' (Active)' : ''}</option>)}
                  </select>
                </label>
              )}

              <label className="flex cursor-pointer flex-col items-center rounded-lg border border-dashed border-border px-6 py-8 text-center hover:border-brand-indigo/50 hover:bg-brand-indigo/[0.02]">
                <FileSpreadsheet className="h-8 w-8 text-brand-indigo" />
                <span className="mt-3 text-sm font-semibold text-text-primary">{file ? file.name : 'Choose CSV or XLSX file'}</span>
                <span className="mt-1 text-xs text-text-secondary">Maximum file size: 5MB</span>
                <input type="file" accept=".csv,.xlsx" onChange={event => setFile(event.target.files?.[0] || null)} className="sr-only" />
              </label>

              {summary && (
                <div className={`rounded-lg border p-4 ${summary.errorCount ? 'border-warning/40 bg-warning/10' : 'border-brand-emerald/30 bg-brand-emerald/10'}`}>
                  <div className="flex items-center gap-2 font-medium text-text-primary"><CheckCircle2 className="h-5 w-5 text-brand-emerald" /> Import complete</div>
                  <p className="mt-2 text-sm text-text-secondary">{summary.successCount} imported, {summary.errorCount} failed, {summary.totalProcessed} processed.</p>
                  {rowErrors.length > 0 && (
                    <div className="mt-3 max-h-32 overflow-y-auto rounded-md bg-white/70 p-3 text-xs text-brand-red">
                      {rowErrors.map((item, index) => <p key={`${item.row}-${index}`} className="mb-1 last:mb-0">Row {item.row + 1}: {item.reason}</p>)}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-border pt-5">
                <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-gray-50">Close</button>
                <button disabled={submitting || !file} className="inline-flex items-center rounded-lg bg-brand-indigo px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />} Import {plural}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
