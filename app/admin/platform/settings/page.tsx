'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Building, Loader2, Save, Settings, SlidersHorizontal } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import AccountSettings from '@/components/AccountSettings';
import api from '@/lib/api';

const navItems = [
  { name: 'Platform Overview', href: '/admin/platform', icon: BarChart3 },
  { name: 'Schools', href: '/admin/platform/schools', icon: Building },
  { name: 'Settings', href: '/admin/platform/settings', icon: Settings },
];

interface PlatformSettings {
  allowSchoolRegistration: boolean;
  aiQuestionImportEnabled: boolean;
  mockExamsEnabled: boolean;
  defaultTrialDays: number;
  supportEmail: string | null;
  maintenanceNotice: string | null;
}

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/super-admin/settings')
      .then((response) => setSettings(response.data.settings))
      .catch((err) => setError(err.response?.data?.error || 'Unable to load platform settings.'))
      .finally(() => setLoading(false));
  }, []);

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await api.put('/super-admin/settings', settings);
      setSettings(response.data.settings);
      setMessage(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Platform settings could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Settings" role="Super Administrator">
      <div className="mb-7"><h1 className="text-2xl font-bold text-text-primary">Platform settings</h1><p className="mt-1 text-sm text-text-secondary">Control platform-wide capabilities and your administrator account.</p></div>
      {loading ? <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-indigo" /></div> : (
        <div className="space-y-6">
          {(message || error) && <div className={`rounded-lg border p-4 text-sm ${error ? 'border-brand-red/20 bg-brand-red/5 text-brand-red' : 'border-brand-emerald/20 bg-brand-emerald/5 text-brand-emerald'}`}>{error || message}</div>}
          {settings && <form onSubmit={saveSettings} className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-start gap-3"><span className="rounded-lg bg-brand-indigo/10 p-2 text-brand-indigo"><SlidersHorizontal className="h-5 w-5" /></span><div><h2 className="text-lg font-semibold text-text-primary">Feature controls</h2><p className="mt-1 text-sm text-text-secondary">These switches are enforced by the backend across all schools.</p></div></div>
            <div className="mt-6 divide-y divide-border rounded-lg border border-border">
              <ToggleRow label="School self-registration" description="Allow new schools to submit registration requests." checked={settings.allowSchoolRegistration} onChange={(checked) => setSettings({ ...settings, allowSchoolRegistration: checked })} />
              <ToggleRow label="AI question import" description="Allow administrators and teachers to process question documents with AI." checked={settings.aiQuestionImportEnabled} onChange={(checked) => setSettings({ ...settings, aiQuestionImportEnabled: checked })} />
              <ToggleRow label="JAMB and WAEC mocks" description="Globally allow students to access mock examinations. School-level controls still apply." checked={settings.mockExamsEnabled} onChange={(checked) => setSettings({ ...settings, mockExamsEnabled: checked })} />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-text-primary">Default trial period (days)<input type="number" min="0" max="365" value={settings.defaultTrialDays} onChange={(event) => setSettings({ ...settings, defaultTrialDays: Number(event.target.value) })} className="mt-1.5 block w-full rounded-lg border border-border px-3 py-2.5 outline-none focus:border-brand-indigo" /></label>
              <label className="text-sm font-medium text-text-primary">Support email<input type="email" value={settings.supportEmail || ''} onChange={(event) => setSettings({ ...settings, supportEmail: event.target.value })} className="mt-1.5 block w-full rounded-lg border border-border px-3 py-2.5 outline-none focus:border-brand-indigo" /></label>
              <label className="text-sm font-medium text-text-primary md:col-span-2">Maintenance notice<textarea rows={3} value={settings.maintenanceNotice || ''} onChange={(event) => setSettings({ ...settings, maintenanceNotice: event.target.value })} placeholder="Optional message for planned maintenance or service notices." className="mt-1.5 block w-full resize-y rounded-lg border border-border px-3 py-2.5 outline-none focus:border-brand-indigo" /></label>
            </div>
            <button type="submit" disabled={saving} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-indigo px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save platform settings</button>
          </form>}
          <AccountSettings />
        </div>
      )}
    </DashboardLayout>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <div className="flex items-center justify-between gap-5 p-4"><div><p className="font-medium text-text-primary">{label}</p><p className="mt-1 text-sm text-text-secondary">{description}</p></div><button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand-indigo' : 'bg-gray-300'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} /></button></div>;
}
