'use client';

import { useState, useEffect } from 'react';
import { Building, Settings, BarChart3, Plus, Loader2, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';

const navItems = [
  { name: 'Platform Overview', href: '/admin/platform', icon: BarChart3 },
  { name: 'Schools', href: '/admin/platform/schools', icon: Building },
  { name: 'Global Settings', href: '/admin/platform/settings', icon: Settings },
];

export default function PlatformSchoolsPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', slug: '', address: '', contactEmail: '',
    contactPhone: '', adminEmail: '', adminPassword: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const res = await api.get('/schools');
      setSchools(res.data.schools);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const generatedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    setFormData({ ...formData, name, slug: generatedSlug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const schoolRes = await api.post('/schools', {
        name: formData.name,
        slug: formData.slug,
        address: formData.address,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone
      });
      
      const schoolId = schoolRes.data.school.id;
      
      // Step 2: Create the initial admin
      if (formData.adminEmail && formData.adminPassword) {
        await api.post(`/schools/${schoolId}/admins`, {
          email: formData.adminEmail,
          password: formData.adminPassword
        });
      }

      setFormData({ name: '', slug: '', address: '', contactEmail: '', contactPhone: '', adminEmail: '', adminPassword: '' });
      setShowAddForm(false);
      fetchSchools();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(`Slug already taken. Suggestion: ${err.response.data.suggestion}`);
      } else {
        setError(err.response?.data?.error || 'Failed to create school');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Schools Management" role="Super Administrator">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Registered Schools</h1>
          <p className="text-sm text-text-secondary mt-1">Manage tenant schools on the platform</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center px-4 py-2 bg-brand-indigo text-white rounded-lg hover:bg-brand-indigo/90 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add School
        </button>
      </div>

      {showAddForm && (
        <div className="bg-card rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)] mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Create New School</h2>
          
          {error && (
            <div className="mb-4 bg-brand-red/10 border-l-4 border-brand-red p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-brand-red mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-brand-red">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">School Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  className="block w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
                  placeholder="e.g., Greenfield Academy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Subdomain Slug</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="block w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
                />
                {formData.slug && (
                  <p className="mt-1 text-xs text-text-secondary">
                    School URL will be: <span className="font-semibold">{formData.slug}.evalhive.ng</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="block w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="block w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
                  placeholder="+234 801 234 5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="block w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
                />
              </div>
            </div>

            <h3 className="text-md font-semibold text-text-primary pt-2">Initial Administrator</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Admin Email</label>
                <input
                  type="email"
                  required
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  className="block w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
                  placeholder="admin@school.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  className="block w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-text-secondary">Admin will be forced to change this on first login.</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 bg-brand-indigo text-white rounded-lg hover:bg-brand-indigo/90 disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                Create School
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-8 w-8 text-brand-indigo animate-spin" />
          </div>
        ) : schools.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            No schools found. Create one.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">School</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Users</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {schools.map((school) => (
                <tr key={school.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-text-primary">{school.name}</div>
                    <div className="text-sm text-text-secondary">{school.contactEmail}</div>
                    {school.contactPhone && <div className="text-sm text-text-secondary">{school.contactPhone}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-text-secondary font-mono bg-background px-2 py-1 rounded">{school.slug}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {school._count?.users || 0} Total
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      school.subscriptionStatus === 'pending_approval'
                        ? 'bg-brand-gold/10 text-brand-gold'
                        : school.isActive
                          ? 'bg-brand-emerald/10 text-brand-emerald'
                          : 'bg-brand-red/10 text-brand-red'
                    }`}>
                      {school.subscriptionStatus === 'pending_approval' ? 'Pending Approval' : school.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
