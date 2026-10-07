'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { getUser, loginAuth, logout, refreshUser } from '@/lib/auth';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(getUser()?.mustChangePassword ?? false);

  useEffect(() => {
    refreshUser()
      .then((user) => setMustChangePassword(user.mustChangePassword))
      .catch(() => undefined);
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 10) {
      setError('Password must be at least 10 characters');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      // Update local user object to show they no longer need to change password
      const user = getUser();
      if (user) {
        user.mustChangePassword = false;
        loginAuth(user);

        // Redirect based on role
        switch (user.role) {
          case 'super_admin':
            router.push('/admin/platform');
            break;
          case 'organization_admin':
            router.push('/admin/organization');
            break;
          case 'tutor':
            router.push('/teacher/dashboard');
            break;
          case 'student':
            router.push('/student/dashboard');
            break;
          default:
            router.push('/login');
        }
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-card p-10 rounded-lg shadow-[0_1px_2px_rgba(17,24,39,0.04)] border border-border">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-brand-gold/20 mb-4">
            <ShieldCheck className="h-6 w-6 text-brand-gold" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">
            Security Check
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            For your security, please create a new password before accessing the platform.
          </p>
        </div>

        {error && (
          <div className="bg-brand-red/10 border-l-4 border-brand-red p-4 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-brand-red mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-brand-red">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleChangePassword}>
          <div className="space-y-4">
            {!mustChangePassword && <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-text-primary mb-1">
                Current Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-text-secondary" />
                </div>
                <input
                  id="current-password"
                  name="current-password"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-brand-gold sm:text-sm bg-background"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
            </div>}
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-text-primary mb-1">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-text-secondary" />
                </div>
                <input
                  id="new-password"
                  name="new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-brand-gold sm:text-sm bg-background"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-text-primary mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-text-secondary" />
                </div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-brand-gold sm:text-sm bg-background"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-brand-gold hover:bg-brand-gold/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(17,24,39,0.04)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
        <button type="button" onClick={logout} disabled={isLoading} className="mt-6 w-full text-sm text-text-secondary hover:text-brand-indigo">
          Sign out and return to login
        </button>
      </div>
    </div>
  );
}
