'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Building, ArrowLeft, Loader2, ShieldCheck, ShieldOff, KeyRound, Users, FileSpreadsheet } from 'lucide-react';
import api from '@/lib/api';
import ResultsTable, { Column } from '@/components/ResultsTable';

export default function SchoolPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get(`/super-admin/schools/${id}/preview`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const toggleSuspend = async () => {
    if (!data) return;
    try {
      setActionLoading(true);
      const endpoint = data.school.isActive ? 'suspend' : 'activate';
      await api.post(`/super-admin/schools/${id}/${endpoint}`);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetAdmin = async () => {
    try {
      setActionLoading(true);
      const res = await api.post(`/super-admin/schools/${id}/reset-admin`);
      alert(`New password for ${res.data.adminEmail}: ${res.data.tempPassword}`);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const navItems = [
    { name: 'Platform Overview', href: '/admin/platform', icon: Building }
  ];

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="School Preview" role="Super Administrator">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-indigo" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data?.school) {
    return (
      <DashboardLayout navItems={navItems} title="School Preview" role="Super Administrator">
        <div className="text-center py-20 text-text-secondary">School not found.</div>
      </DashboardLayout>
    );
  }

  const { school, recentExams, adminUsers } = data;
  const isPendingApproval = school.subscriptionStatus === 'pending_approval';

  const examColumns: Column<any>[] = [
    { header: 'Title', accessorKey: 'title', sortable: true },
    { header: 'Subject', sortable: true, accessorKey: 'subject', cell: (row) => row.subject?.name || '-' },
    { header: 'Type', accessorKey: 'examType', sortable: true },
    { header: 'Status', accessorKey: 'status', sortable: true, cell: (row) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
        {row.status}
      </span>
    )},
    { header: 'Created', accessorKey: 'createdAt', cell: (row) => new Date(row.createdAt).toLocaleDateString() }
  ];

  return (
    <DashboardLayout navItems={navItems} title={`${school.name} — Preview`} role="Super Administrator">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center text-text-secondary hover:text-brand-indigo font-medium transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Platform
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetAdmin}
            disabled={actionLoading}
            className="inline-flex items-center px-4 py-2 border border-brand-gold text-brand-gold text-sm font-medium rounded-md hover:bg-brand-gold/10 transition-colors"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
            Reset Admin Password
          </button>

          <button
            onClick={toggleSuspend}
            disabled={actionLoading}
            className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-md transition-colors ${school.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-emerald hover:bg-brand-emerald/90'}`}
          >
            {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (school.isActive ? <ShieldOff className="w-4 h-4 mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />)}
            {school.isActive ? 'Suspend School' : isPendingApproval ? 'Approve School' : 'Activate School'}
          </button>
        </div>
      </div>

      {/* School Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="col-span-2 bg-card rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <h3 className="text-lg font-bold text-text-primary mb-4">{school.name}</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium text-text-secondary w-32 inline-block">Slug:</span> <span className="font-mono text-text-primary">{school.slug}</span></p>
            <p><span className="font-medium text-text-secondary w-32 inline-block">Contact:</span> {school.contactEmail || '-'}</p>
            <p><span className="font-medium text-text-secondary w-32 inline-block">Phone:</span> {school.contactPhone || '-'}</p>
            <p><span className="font-medium text-text-secondary w-32 inline-block">Address:</span> {school.address || '-'}</p>
            <p><span className="font-medium text-text-secondary w-32 inline-block">Status:</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isPendingApproval
                  ? 'bg-brand-gold/10 text-brand-gold'
                  : school.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
              }`}>
                {isPendingApproval ? 'Pending Approval' : school.isActive ? 'Active' : 'Suspended'}
              </span>
            </p>
            {school.trialEndsAt && (
              <p><span className="font-medium text-text-secondary w-32 inline-block">Trial Ends:</span> {new Date(school.trialEndsAt).toLocaleDateString()}</p>
            )}
            <p><span className="font-medium text-text-secondary w-32 inline-block">Created:</span> {new Date(school.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Students', value: school._count?.students || 0, icon: Users, color: 'brand-emerald' },
            { label: 'Teachers', value: school._count?.teachers || 0, icon: Users, color: 'brand-indigo' },
            { label: 'Exams Taken', value: school._count?.examAttempts || 0, icon: FileSpreadsheet, color: 'brand-gold' },
          ].map(stat => (
            <div key={stat.label} className="bg-card rounded-lg border border-border p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)] flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-text-secondary">{stat.label}</p>
                <p className="text-xl font-bold text-text-primary">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Users */}
      <div className="mb-10">
        <h3 className="text-lg font-bold text-text-primary mb-3">School Admins</h3>
        <div className="bg-card rounded-lg border border-border overflow-hidden shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {adminUsers?.map((u: any) => (
                <tr key={u.email}>
                  <td className="px-6 py-3 text-sm">{u.email}</td>
                  <td className="px-6 py-3 text-sm text-text-secondary">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-3"><span className={`text-xs font-medium ${u.isActive ? 'text-green-600' : 'text-red-500'}`}>{u.isActive ? 'Yes' : 'No'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Exams */}
      <h3 className="text-lg font-bold text-text-primary mb-3">Recent Exams</h3>
      <ResultsTable data={recentExams || []} columns={examColumns} emptyMessage="No exams created yet." />
    </DashboardLayout>
  );
}
