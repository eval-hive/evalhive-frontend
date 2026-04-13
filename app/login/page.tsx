'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
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
        .catch(err => {
          setSchoolError("School not found. Check your link or contact Eval Hive support.");
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

      // Routing logic handled closely to middleware principles
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
        <div className="max-w-md w-full bg-card p-10 rounded-xl shadow-sm border border-border text-center">
          <AlertCircle className="h-12 w-12 text-brand-red mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Access Error</h2>
          <p className="text-text-secondary">{schoolError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-card p-10 rounded-xl shadow-sm border border-border">
        <div className="text-center">
          {schoolData?.logoUrl ? (
            <img src={schoolData.logoUrl} alt={schoolData.name} className="mx-auto h-16 w-auto mb-4" />
          ) : null}
          <h2 className="mt-2 text-center text-3xl font-bold text-text-primary tracking-tight">
            {schoolData ? schoolData.name : 'Eval Hive'}
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            {slug ? 'Sign in to your school account' : 'Sign in to Platform Admin'}
          </p>
        </div>

        {error && (
          <div className="bg-brand-red/10 border-l-4 border-brand-red p-4 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-brand-red mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-brand-red">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-text-primary mb-1">
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
                  className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-brand-indigo sm:text-sm bg-background text-text-primary"
                  placeholder="admin@school.edu.ng or STD001"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
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
                  className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-brand-indigo sm:text-sm bg-background text-text-primary"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-brand-indigo hover:bg-brand-indigo/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-indigo transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
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
          </div>
        </form>
      </div>
    </div>
  );
}
