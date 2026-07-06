'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { loginAuth } from '@/lib/auth';
import { getSchoolSlugClient } from '@/lib/tenant';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [schoolData, setSchoolData] = useState<any>(null);
  const [isSchoolLoading, setIsSchoolLoading] = useState(true);
  const [schoolError, setSchoolError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    const currentSlug = getSchoolSlugClient();
    setSlug(currentSlug);

    if (currentSlug) {
      api.get(`/schools/resolve/${currentSlug}`)
        .then(res => {
          setSchoolData(res.data.school);
          if (res.data.school && !res.data.school.isActive) {
            setSchoolError("This school's account is currently suspended. Contact Eval Hive support.");
          }
        })
        .catch(() => {
          setSchoolError('School not found. Check your link or contact Eval Hive support.');
        })
        .finally(() => {
          setIsSchoolLoading(false);
        });
    } else {
      setIsSchoolLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email: identifier,
        password,
        school_slug: slug,
      });

      const { token, user } = response.data;
      loginAuth(token, user);

      if (user.mustChangePassword) {
        router.push('/change-password');
      } else {
        switch (user.role) {
          case 'super_admin':
            router.push('/admin/platform');
            break;
          case 'school_admin':
            router.push('/admin/school');
            break;
          case 'teacher':
            router.push('/teacher/dashboard');
            break;
          case 'student':
            router.push('/student/dashboard');
            break;
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials or connection issue');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSchoolLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin h-8 w-8 text-brand-indigo" />
      </div>
    );
  }

  if (schoolError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full bg-card p-10 rounded-lg shadow-xl shadow-brand-indigo/10 border border-border text-center">
          <AlertCircle className="h-12 w-12 text-brand-red mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Access Error</h2>
          <p className="text-text-secondary">{schoolError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl overflow-hidden rounded-lg border border-border bg-card shadow-2xl shadow-brand-indigo/10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden bg-brand-indigo p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-gold text-sm font-black text-brand-indigo">
                EH
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">Eval Hive</p>
                <p className="text-xs font-medium text-white/60">School CBT Suite</p>
              </div>
            </div>
            <div className="mt-24 max-w-md">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-gold">Secure assessment platform</p>
              <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight">
                Professional CBT management for modern secondary schools.
              </h1>
              <p className="mt-5 text-base leading-7 text-white/70">
                Manage exams, mock practice, question banks, student attempts, and results from one polished school portal.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {['Question Banks', 'Mock Exams', 'Result Analytics'].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white/80">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div>
              {schoolData?.logoUrl ? (
                <img src={schoolData.logoUrl} alt={schoolData.name} className="h-16 w-auto mb-6" />
              ) : (
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-indigo/10 text-brand-indigo">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              )}
              <h2 className="text-3xl font-bold text-text-primary tracking-tight">
                {schoolData ? schoolData.name : 'Eval Hive'}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {slug ? 'Sign in to your school account' : 'Sign in to Platform Admin'}
              </p>
            </div>

            {error && (
              <div className="mt-6 bg-brand-red/10 border border-brand-red/20 p-4 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 text-brand-red mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-brand-red">{error}</p>
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="identifier" className="block text-sm font-semibold text-text-primary mb-1">
                    Email or Admission Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-text-secondary" />
                    </div>
                    <input
                      id="identifier"
                      name="identifier"
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-border rounded-lg placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo sm:text-sm bg-background text-text-primary"
                      placeholder="admin@school.edu.ng or STD001"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-text-primary mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-text-secondary" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-border rounded-lg placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo sm:text-sm bg-background text-text-primary"
                      placeholder="Password"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-brand-indigo hover:bg-brand-indigo/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-indigo transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-brand-indigo/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
