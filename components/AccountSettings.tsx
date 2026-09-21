'use client';

import { useEffect, useState } from 'react';
import { Camera, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { getAuthToken, getUser, loginAuth } from '@/lib/auth';

export default function AccountSettings() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    api.get('/auth/me').then((response) => setAvatarUrl(response.data.user.avatarUrl || null)).catch(() => undefined);
  }, []);

  const uploadAvatar = async (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Profile picture must be 2MB or smaller.');
      return;
    }
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const body = new FormData();
      body.append('avatar', file);
      const response = await api.post('/auth/avatar', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAvatarUrl(response.data.user.avatarUrl);
      const currentUser = getUser();
      const token = getAuthToken();
      if (currentUser && token) {
        loginAuth(token, { ...currentUser, avatarUrl: response.data.user.avatarUrl });
        window.dispatchEvent(new Event('auth-updated'));
      }
      setMessage('Profile picture updated.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Profile picture could not be uploaded.');
    } finally {
      setUploading(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingPassword(true);
    setError('');
    setMessage('');
    try {
      await api.post('/auth/change-password', passwords);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Password changed successfully.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Password could not be changed.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {(message || error) && <div className={`rounded-lg border p-4 text-sm ${error ? 'border-brand-red/20 bg-brand-red/5 text-brand-red' : 'border-brand-emerald/20 bg-brand-emerald/5 text-brand-emerald'}`}>{error || message}</div>}

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-text-primary">Profile picture</h2>
        <p className="mt-1 text-sm text-text-secondary">JPG, PNG, or WebP. Maximum size 2MB.</p>
        <div className="mt-5 flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-background text-xl font-bold text-brand-indigo">
            {avatarUrl ? <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : getUser()?.displayName?.charAt(0).toUpperCase()}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-background">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {uploading ? 'Uploading...' : 'Change picture'}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={(event) => uploadAvatar(event.target.files?.[0])} />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-3"><span className="rounded-lg bg-brand-indigo/10 p-2 text-brand-indigo"><KeyRound className="h-5 w-5" /></span><div><h2 className="text-lg font-semibold text-text-primary">Change password</h2><p className="mt-1 text-sm text-text-secondary">Use at least six characters and keep this password private.</p></div></div>
        <form onSubmit={changePassword} className="mt-6 grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-3">
          <PasswordField label="Current password" value={passwords.currentPassword} onChange={(value) => setPasswords((current) => ({ ...current, currentPassword: value }))} />
          <PasswordField label="New password" value={passwords.newPassword} onChange={(value) => setPasswords((current) => ({ ...current, newPassword: value }))} />
          <PasswordField label="Confirm new password" value={passwords.confirmPassword} onChange={(value) => setPasswords((current) => ({ ...current, confirmPassword: value }))} />
          <div className="md:col-span-3"><button type="submit" disabled={savingPassword} className="inline-flex items-center gap-2 rounded-lg bg-brand-indigo px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">{savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Update password</button></div>
        </form>
      </section>
    </div>
  );
}

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-sm font-medium text-text-primary">{label}<input type="password" required value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-border px-3 py-2.5 outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/10" /></label>;
}
