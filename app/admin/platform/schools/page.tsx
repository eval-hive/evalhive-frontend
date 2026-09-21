'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, BarChart3, Building, Eye, KeyRound, Loader2, Pencil, Plus, ShieldCheck, ShieldOff, Trash2, X } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';

const navItems = [
  { name: 'Platform Overview', href: '/admin/platform', icon: BarChart3 },
  { name: 'Schools', href: '/admin/platform/schools', icon: Building },
];

interface SchoolRecord {
  id: string;
  name: string;
  slug: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  adminEmail?: string | null;
  isActive: boolean;
  subscriptionStatus: string;
  activeStudents: number;
  teacherCount: number;
  examsTaken: number;
}

const emptyForm = { name: '', slug: '', address: '', contactEmail: '', contactPhone: '', adminEmail: '', adminPassword: '' };

export default function PlatformSchoolsPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingSchool, setEditingSchool] = useState<SchoolRecord | null>(null);
  const [editForm, setEditForm] = useState({ name: '', slug: '', address: '', contactEmail: '', contactPhone: '', adminEmail: '' });
  const [deletingSchool, setDeletingSchool] = useState<SchoolRecord | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const fetchSchools = async () => {
    try {
      const response = await api.get('/super-admin/schools');
      setSchools(response.data.schools || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to load schools.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchools(); }, []);

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    setForm((current) => ({ ...current, name, slug }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/super-admin/schools', form);
      setForm(emptyForm);
      setShowForm(false);
      setNotice('School and initial administrator created successfully.');
      await fetchSchools();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create school.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSchool = async (school: SchoolRecord) => {
    setActionLoading(school.id);
    setError('');
    try {
      const action = school.isActive ? 'suspend' : 'activate';
      const response = await api.post(`/super-admin/schools/${school.id}/${action}`);
      setNotice(response.data.message || `School ${action}d successfully.`);
      await fetchSchools();
    } catch (err: any) {
      setError(err.response?.data?.error || 'The school status could not be updated.');
    } finally {
      setActionLoading('');
    }
  };

  const resetAdmin = async (school: SchoolRecord) => {
    setActionLoading(`reset-${school.id}`);
    setError('');
    try {
      const response = await api.post(`/super-admin/schools/${school.id}/reset-admin`);
      setNotice(`Temporary password for ${response.data.adminEmail}: ${response.data.tempPassword}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'The administrator password could not be reset.');
    } finally {
      setActionLoading('');
    }
  };

  const openEdit = (school: SchoolRecord) => {
    setEditingSchool(school);
    setEditForm({
      name: school.name,
      slug: school.slug,
      address: school.address || '',
      contactEmail: school.contactEmail || '',
      contactPhone: school.contactPhone || '',
      adminEmail: school.adminEmail || '',
    });
  };

  const saveSchool = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingSchool) return;
    setSubmitting(true);
    setError('');
    try {
      await api.put(`/super-admin/schools/${editingSchool.id}`, editForm);
      const slugChanged = editingSchool.slug !== editForm.slug;
      setNotice(slugChanged
        ? `School updated. Its new address is ${editForm.slug}.evalhive.ng; existing Cloudinary asset URLs remain valid.`
        : 'School details updated successfully.');
      setEditingSchool(null);
      await fetchSchools();
    } catch (err: any) {
      setError(err.response?.data?.error || 'The school could not be updated.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSchool = async () => {
    if (!deletingSchool || deleteConfirmation !== deletingSchool.slug) return;
    setActionLoading(`delete-${deletingSchool.id}`);
    setError('');
    try {
      const response = await api.delete(`/super-admin/schools/${deletingSchool.id}`, { data: { slug: deleteConfirmation } });
      setNotice(response.data.message);
      setDeletingSchool(null);
      setDeleteConfirmation('');
      await fetchSchools();
    } catch (err: any) {
      setError(err.response?.data?.error || 'The school could not be deleted.');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Schools" role="Super Administrator">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><h1 className="text-2xl font-bold text-text-primary">School management</h1><p className="mt-1 text-sm text-text-secondary">Approve, inspect, and manage every school on the platform.</p></div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-indigo px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-indigo/90"><Plus className="h-4 w-4" /> Add school</button>
      </div>

      {error && <div className="mb-5 flex items-start gap-3 rounded-lg border border-brand-red/20 bg-brand-red/5 p-4 text-sm text-brand-red"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      {notice && <div className="mb-5 flex items-start justify-between gap-3 rounded-lg border border-brand-emerald/20 bg-brand-emerald/5 p-4 text-sm text-brand-emerald"><span>{notice}</span><button onClick={() => setNotice('')} title="Dismiss"><X className="h-4 w-4" /></button></div>}

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
        {loading ? <div className="flex p-12 justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-indigo" /></div> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-background"><tr>{['School', 'Domain', 'Students', 'Teachers', 'Attempts', 'Status', 'Actions'].map((heading) => <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-border">
                {schools.map((school) => (
                  <tr key={school.id} className="hover:bg-background/70">
                    <td className="px-5 py-4"><p className="font-medium text-text-primary">{school.name}</p><p className="mt-0.5 text-xs text-text-secondary">{school.contactEmail || school.contactPhone || 'No contact details'}</p></td>
                    <td className="px-5 py-4 text-sm text-text-secondary">{school.slug}.evalhive.ng</td>
                    <td className="px-5 py-4 text-sm text-text-primary">{school.activeStudents}</td>
                    <td className="px-5 py-4 text-sm text-text-primary">{school.teacherCount}</td>
                    <td className="px-5 py-4 text-sm text-text-primary">{school.examsTaken}</td>
                    <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${school.subscriptionStatus === 'pending_approval' ? 'bg-brand-gold/10 text-brand-gold' : school.isActive ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-brand-red/10 text-brand-red'}`}>{school.subscriptionStatus === 'pending_approval' ? 'Pending approval' : school.isActive ? 'Active' : 'Suspended'}</span></td>
                    <td className="px-5 py-4"><div className="flex items-center gap-1">
                      <button onClick={() => router.push(`/admin/platform/schools/${school.id}`)} className="rounded-md p-2 text-text-secondary hover:bg-brand-indigo/10 hover:text-brand-indigo" title="View school"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => openEdit(school)} className="rounded-md p-2 text-text-secondary hover:bg-brand-indigo/10 hover:text-brand-indigo" title="Edit school"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => toggleSchool(school)} disabled={actionLoading === school.id} className="rounded-md p-2 text-text-secondary hover:bg-background disabled:opacity-50" title={school.isActive ? 'Suspend school' : school.subscriptionStatus === 'pending_approval' ? 'Approve school' : 'Activate school'}>{actionLoading === school.id ? <Loader2 className="h-4 w-4 animate-spin" /> : school.isActive ? <ShieldOff className="h-4 w-4 text-brand-red" /> : <ShieldCheck className="h-4 w-4 text-brand-emerald" />}</button>
                      <button onClick={() => resetAdmin(school)} disabled={actionLoading === `reset-${school.id}`} className="rounded-md p-2 text-text-secondary hover:bg-brand-gold/10 hover:text-brand-gold disabled:opacity-50" title="Reset administrator password">{actionLoading === `reset-${school.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}</button>
                      <button onClick={() => { setDeletingSchool(school); setDeleteConfirmation(''); }} className="rounded-md p-2 text-text-secondary hover:bg-brand-red/10 hover:text-brand-red" title="Delete school"><Trash2 className="h-4 w-4" /></button>
                    </div></td>
                  </tr>
                ))}
                {!schools.length && <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-text-secondary">No schools have been registered.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between"><div><h2 className="text-xl font-bold text-text-primary">Add school</h2><p className="mt-1 text-sm text-text-secondary">Create the school and its first administrator.</p></div><button onClick={() => setShowForm(false)} className="rounded-md p-2 text-text-secondary hover:bg-background" title="Close"><X className="h-5 w-5" /></button></div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="School name" value={form.name} onChange={handleNameChange} required />
          <Field label="Subdomain slug" value={form.slug} onChange={(value) => setForm((current) => ({ ...current, slug: value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} required helper={form.slug ? `${form.slug}.evalhive.ng` : undefined} />
          <Field label="Contact email" type="email" value={form.contactEmail} onChange={(value) => setForm((current) => ({ ...current, contactEmail: value }))} />
          <Field label="Phone number" type="tel" value={form.contactPhone} onChange={(value) => setForm((current) => ({ ...current, contactPhone: value }))} />
          <div className="md:col-span-2"><Field label="Address" value={form.address} onChange={(value) => setForm((current) => ({ ...current, address: value }))} /></div>
          <Field label="Administrator email" type="email" value={form.adminEmail} onChange={(value) => setForm((current) => ({ ...current, adminEmail: value }))} required />
          <Field label="Temporary password" type="password" value={form.adminPassword} onChange={(value) => setForm((current) => ({ ...current, adminPassword: value }))} required />
          <div className="mt-2 flex justify-end gap-3 md:col-span-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-background">Cancel</button><button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-brand-indigo px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{submitting && <Loader2 className="h-4 w-4 animate-spin" />} Create school</button></div>
        </form>
      </div></div>}

      {editingSchool && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between"><div><h2 className="text-xl font-bold text-text-primary">Edit school</h2><p className="mt-1 text-sm text-text-secondary">Identity changes keep all existing records attached to the same school.</p></div><button onClick={() => setEditingSchool(null)} className="rounded-md p-2 text-text-secondary hover:bg-background" title="Close"><X className="h-5 w-5" /></button></div>
        <form onSubmit={saveSchool} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="School name" value={editForm.name} onChange={(value) => setEditForm((current) => ({ ...current, name: value }))} required />
          <Field label="Subdomain slug" value={editForm.slug} onChange={(value) => setEditForm((current) => ({ ...current, slug: value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} required helper={editForm.slug ? `${editForm.slug}.evalhive.ng` : undefined} />
          <Field label="School contact email" type="email" value={editForm.contactEmail} onChange={(value) => setEditForm((current) => ({ ...current, contactEmail: value }))} />
          <Field label="School phone" type="tel" value={editForm.contactPhone} onChange={(value) => setEditForm((current) => ({ ...current, contactPhone: value }))} />
          <div className="md:col-span-2"><Field label="Address" value={editForm.address} onChange={(value) => setEditForm((current) => ({ ...current, address: value }))} /></div>
          <div className="md:col-span-2"><Field label="Primary administrator email" type="email" value={editForm.adminEmail} onChange={(value) => setEditForm((current) => ({ ...current, adminEmail: value }))} required /></div>
          <div className="rounded-lg border border-brand-gold/30 bg-brand-gold/5 p-3 text-sm text-text-secondary md:col-span-2">Changing the slug changes the school's login address immediately. Database records are unaffected because they use the school ID. Existing Cloudinary files keep their current URLs; new uploads use the new slug folder.</div>
          <div className="mt-2 flex justify-end gap-3 md:col-span-2"><button type="button" onClick={() => setEditingSchool(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-background">Cancel</button><button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-brand-indigo px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{submitting && <Loader2 className="h-4 w-4 animate-spin" />} Save changes</button></div>
        </form>
      </div></div>}

      {deletingSchool && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"><div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-brand-red/10 text-brand-red"><Trash2 className="h-5 w-5" /></div>
        <h2 className="text-xl font-bold text-text-primary">Permanently delete school?</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">This permanently removes <strong className="text-text-primary">{deletingSchool.name}</strong>, its users, exams, questions, attempts, answers, results, and academic records. This cannot be undone.</p>
        <label className="mt-5 block text-sm font-medium text-text-primary">Type <span className="font-mono text-brand-red">{deletingSchool.slug}</span> to confirm<input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} autoComplete="off" className="mt-2 w-full rounded-lg border border-border px-3 py-2.5 outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/10" /></label>
        <div className="mt-6 flex justify-end gap-3"><button onClick={() => setDeletingSchool(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-background">Cancel</button><button onClick={deleteSchool} disabled={deleteConfirmation !== deletingSchool.slug || actionLoading === `delete-${deletingSchool.id}`} className="inline-flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">{actionLoading === `delete-${deletingSchool.id}` && <Loader2 className="h-4 w-4 animate-spin" />} Delete permanently</button></div>
      </div></div>}
    </DashboardLayout>
  );
}

function Field({ label, type = 'text', value, onChange, required, helper }: { label: string; type?: string; value: string; onChange: (value: string) => void; required?: boolean; helper?: string }) {
  return <label className="block text-sm font-medium text-text-primary">{label}<input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/10" />{helper && <span className="mt-1 block text-xs font-normal text-text-secondary">School URL: {helper}</span>}</label>;
}
