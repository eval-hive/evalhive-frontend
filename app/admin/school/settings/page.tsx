'use client';

import { useEffect, useState } from 'react';
import { Building2, Camera, Loader2, Save, Settings } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import AccountSettings from '@/components/AccountSettings';
import api from '@/lib/api';

const navItems = [{ name: 'Settings', href: '/admin/school/settings', icon: Settings }];

interface SchoolSettings {
  name: string;
  slug: string;
  address: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  logoUrl: string | null;
}

export default function SchoolSettingsPage() {
  const [school, setSchool] = useState<SchoolSettings | null>(null);
  const [form, setForm] = useState({ address: '', contactEmail: '', contactPhone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/schools/settings')
      .then((response) => {
        const details = response.data.school;
        setSchool(details);
        setForm({ address: details.address || '', contactEmail: details.contactEmail || '', contactPhone: details.contactPhone || '' });
      })
      .catch((err) => setError(err.response?.data?.error || 'Unable to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const saveSchool = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await api.put('/schools/settings', form);
      setSchool((current) => current ? { ...current, ...response.data.school } : response.data.school);
      setMessage('School profile updated.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'School profile could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('School logo must be 2MB or smaller.');
      return;
    }
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const body = new FormData();
      body.append('logo', file);
      const response = await api.post('/schools/settings/logo', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSchool((current) => current ? { ...current, logoUrl: response.data.school.logoUrl } : current);
      setMessage('School logo updated.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'School logo could not be uploaded.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Settings" role="School Admin">
      <div className="mb-7"><h1 className="text-2xl font-bold text-text-primary">School settings</h1><p className="mt-1 text-sm text-text-secondary">Manage your school branding, contact details, profile picture, and password.</p></div>
      {loading ? <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-indigo" /></div> : (
        <div className="space-y-6">
          {(message || error) && <div className={`rounded-lg border p-4 text-sm ${error ? 'border-brand-red/20 bg-brand-red/5 text-brand-red' : 'border-brand-emerald/20 bg-brand-emerald/5 text-brand-emerald'}`}>{error || message}</div>}
          {school && <section className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-start gap-3"><span className="rounded-lg bg-brand-indigo/10 p-2 text-brand-indigo"><Building2 className="h-5 w-5" /></span><div><h2 className="text-lg font-semibold text-text-primary">School profile</h2><p className="mt-1 text-sm text-text-secondary">Name and domain changes are handled by the platform administrator.</p></div></div>
            <div className="mt-6 flex flex-col gap-6 lg:flex-row">
              <div className="flex w-full max-w-xs flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background p-5 text-center">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg border border-border bg-card text-2xl font-bold text-brand-indigo">{school.logoUrl ? <img src={school.logoUrl} alt={`${school.name} logo`} className="h-full w-full object-contain" /> : school.name.charAt(0)}</div>
                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-text-primary hover:bg-white">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}{uploading ? 'Uploading...' : 'Change school logo'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={uploading} onChange={(event) => uploadLogo(event.target.files?.[0])} /></label>
              </div>
              <form onSubmit={saveSchool} className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                <ReadOnlyField label="School name" value={school.name} />
                <ReadOnlyField label="School domain" value={`${school.slug}.evalhive.ng`} />
                <Field label="Contact email" type="email" value={form.contactEmail} onChange={(value) => setForm((current) => ({ ...current, contactEmail: value }))} />
                <Field label="Phone number" type="tel" value={form.contactPhone} onChange={(value) => setForm((current) => ({ ...current, contactPhone: value }))} />
                <div className="md:col-span-2"><Field label="School address" value={form.address} onChange={(value) => setForm((current) => ({ ...current, address: value }))} /></div>
                <div className="md:col-span-2"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-brand-indigo px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save school profile</button></div>
              </form>
            </div>
          </section>}
          <AccountSettings />
        </div>
      )}
    </DashboardLayout>
  );
}

function Field({ label, type = 'text', value, onChange }: { label: string; type?: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-sm font-medium text-text-primary">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-border px-3 py-2.5 outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/10" /></label>;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return <label className="text-sm font-medium text-text-primary">{label}<input value={value} readOnly className="mt-1.5 block w-full cursor-not-allowed rounded-lg border border-border bg-background px-3 py-2.5 text-text-secondary" /></label>;
}
