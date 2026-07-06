'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Building, Users, BarChart3, Plus, Eye, ShieldOff,
  ShieldCheck, Loader2, KeyRound, X
} from 'lucide-react';
import api from '@/lib/api';

const navItems = [
  { name: 'Platform Overview', href: '/admin/platform', icon: BarChart3 },
  { name: 'Schools', href: '/admin/platform', icon: Building },
];

interface School {
  id: string; name: string; slug: string; contactEmail: string;
  isActive: boolean; subscriptionStatus: string; createdAt: string;
  activeStudents: number; teacherCount: number; examsTaken: number;
}

interface Analytics {
  totalSchools: number; activeSchools: number; totalStudents: number;
  totalExamsTaken: number; examsTakenThisMonth: number;
  mostActiveSchool: { name: string; attempts: number } | null;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', slug: '', address: '', contactEmail: '', adminEmail: '', adminPassword: ''
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [schoolsRes, analyticsRes] = await Promise.all([
        api.get('/super-admin/schools'),
        api.get('/super-admin/analytics')
      ]);
      setSchools(schoolsRes.data.schools || []);
      setAnalytics(analyticsRes.data.analytics);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggleSuspend = async (school: School) => {
    try {
      setActionLoading(school.id);
      if (school.isActive) {
        await api.post(`/super-admin/schools/${school.id}/suspend`);
      } else {
        await api.post(`/super-admin/schools/${school.id}/activate`);
      }
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetAdmin = async (school: School) => {
    try {
      setActionLoading(`reset-${school.id}`);
      const res = await api.post(`/super-admin/schools/${school.id}/reset-admin`);
      alert(`New password for ${res.data.adminEmail}: ${res.data.tempPassword}\n\nAsk the admin to change this on first login.`);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/super-admin/schools', form);
      setShowModal(false);
      setForm({ name: '', slug: '', address: '', contactEmail: '', adminEmail: '', adminPassword: '' });
      await fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create school');
    } finally {
      setSubmitting(false);
    }
  };

  const statCards = analytics ? [
    { label: 'Total Schools', value: analytics.totalSchools, color: 'brand-indigo', icon: Building },
    { label: 'Active Schools', value: analytics.activeSchools, color: 'brand-emerald', icon: ShieldCheck },
    { label: 'Total Students', value: analytics.totalStudents, color: 'brand-gold', icon: Users },
    { label: 'Exams This Month', value: analytics.examsTakenThisMonth, color: 'brand-indigo', icon: BarChart3 },
  ] : [];

  return (
    <DashboardLayout navItems={navItems} title="Platform Admin" role="Super Administrator">

      {/* Analytics Bar */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-indigo" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {statCards.map(card => (
              <div key={card.label} className="bg-card rounded-lg border border-border p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                <div className={`w-10 h-10 rounded-lg bg-${card.color}/10 flex items-center justify-center mb-3`}>
                  <card.icon className={`w-5 h-5 text-${card.color}`} />
                </div>
                <p className="text-sm font-medium text-text-secondary">{card.label}</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Schools Table */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary">All Schools</h2>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-brand-indigo text-white text-sm font-medium rounded-md hover:bg-brand-indigo/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add School
            </button>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-background">
                  <tr>
                    {['School Name', 'Slug', 'Students', 'Exams Taken', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {schools.map(school => (
                    <tr key={school.id} className="hover:bg-background transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-text-primary">{school.name}</p>
                        {school.contactEmail && <p className="text-xs text-text-secondary">{school.contactEmail}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary font-mono">{school.slug}</td>
                      <td className="px-6 py-4 text-sm text-text-primary">{school.activeStudents}</td>
                      <td className="px-6 py-4 text-sm text-text-primary">{school.examsTaken}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${school.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {school.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/platform/schools/${school.id}`)}
                            className="p-1.5 text-text-secondary hover:text-brand-indigo transition-colors" title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleSuspend(school)}
                            disabled={actionLoading === school.id}
                            className={`p-1.5 transition-colors ${school.isActive ? 'text-text-secondary hover:text-red-500' : 'text-text-secondary hover:text-green-500'}`}
                            title={school.isActive ? 'Suspend' : 'Activate'}
                          >
                            {actionLoading === school.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (school.isActive ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />)}
                          </button>
                          <button
                            onClick={() => handleResetAdmin(school)}
                            disabled={actionLoading === `reset-${school.id}`}
                            className="p-1.5 text-text-secondary hover:text-brand-gold transition-colors" title="Reset Admin Password"
                          >
                            {actionLoading === `reset-${school.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {schools.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-text-secondary text-sm">
                        No schools registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Create School Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card w-full max-w-md rounded-lg shadow-xl border border-border p-8 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-text-primary mb-6">Create New School</h3>
            <form onSubmit={handleCreateSchool} className="space-y-4">
              {[
                { label: 'School Name', key: 'name', type: 'text', placeholder: 'Greenfield Academy' },
                { label: 'URL Slug', key: 'slug', type: 'text', placeholder: 'greenfield' },
                { label: 'Address', key: 'address', type: 'text', placeholder: '123 Main St, Lagos' },
                { label: 'Contact Email', key: 'contactEmail', type: 'email', placeholder: 'info@school.edu.ng' },
                { label: 'Admin Email', key: 'adminEmail', type: 'email', placeholder: 'admin@school.edu.ng' },
                { label: 'Admin Password', key: 'adminPassword', type: 'password', placeholder: '••••••••' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-text-secondary mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    required={['name', 'slug', 'adminEmail', 'adminPassword'].includes(field.key)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-indigo"
                  />
                </div>
              ))}
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-brand-indigo text-white rounded-lg text-sm font-medium hover:bg-brand-indigo/90 flex items-center justify-center"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {submitting ? 'Creating...' : 'Create School'}
              </button>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
