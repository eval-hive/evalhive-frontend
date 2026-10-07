"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

type Cohort = { id: string; name: string };
type Person = {
  id: string; email: string; role: "tutor" | "student"; firstName: string; lastName: string;
  isActive: boolean; mustChangePassword: boolean;
  studentProfile?: { id: string; cohortMemberships: { cohort: Cohort }[] } | null;
};

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", role: "student", cohortIds: [] as string[] });
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [peopleResponse, cohortResponse] = await Promise.all([
      api.get("/people", { params: { search: search || undefined, role: role || undefined } }),
      api.get("/cohorts", { params: { active: true } }),
    ]);
    setPeople(peopleResponse.data.people);
    setCohorts(cohortResponse.data.cohorts);
  }, [search, role]);

  useEffect(() => { load().catch(() => setMessage("Could not load organization people.")); }, [load]);

  async function createPerson(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(""); setTemporaryPassword(null);
    try {
      const response = await api.post("/people", form);
      setTemporaryPassword(response.data.temporaryPassword);
      setForm({ firstName: "", lastName: "", email: "", role: "student", cohortIds: [] });
      setMessage("Member created. Copy the temporary password now; it is shown only in this response.");
      await load();
    } catch (error: any) { setMessage(error.response?.data?.error || "Could not create member."); }
    finally { setBusy(false); }
  }

  async function setStatus(person: Person) {
    await api.patch(`/people/${person.id}/status`, { isActive: !person.isActive });
    await load();
  }

  async function resetPassword(person: Person) {
    setTemporaryPassword(null); setMessage("");
    try {
      const response = await api.post("/auth/admin-reset-password", { userId: person.id });
      setTemporaryPassword(response.data.temporaryPassword);
      setMessage(`Temporary password generated for ${person.firstName}. Their active sessions were revoked.`);
      await load();
    } catch (error: any) { setMessage(error.response?.data?.error || "Could not reset password."); }
  }

  async function anonymizeStudent(person: Person) {
    const confirmed = window.confirm(`Permanently anonymize ${person.firstName} ${person.lastName}? Their account, email, cohort memberships, and login access will be removed. Historical assessment records will remain under an anonymous identity. This cannot be reversed.`);
    if (!confirmed) return;
    setMessage("");
    try {
      const response = await api.post(`/privacy/students/${person.id}/anonymize`, { confirm: "ANONYMIZE" });
      setMessage(`Student anonymized. ${response.data.student.retainedAttempts} historical attempt(s) were retained without their identity.`);
      await load();
    } catch (error: any) { setMessage(error.response?.data?.error || "Could not anonymize student."); }
  }

  async function importStudents(file: File) {
    setBusy(true); setMessage("");
    const body = new FormData(); body.append("file", file);
    try {
      const response = await api.post("/people/students/import", body, { headers: { "Content-Type": "multipart/form-data" } });
      const summary = response.data.summary;
      setMessage(`Import finished: ${summary.successCount} added, ${summary.errorCount} rejected. ${response.data.errors.map((item: any) => `Row ${item.row}: ${item.reason}`).join(" ")}`);
      await load();
    } catch (error: any) { setMessage(error.response?.data?.error || "Could not import students."); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-[#f5f7fb] text-slate-950"><div className="mx-auto max-w-7xl px-6 py-10"><Link href="/admin/organization" className="text-sm font-semibold text-amber-700">← Organization home</Link><div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[.2em] text-amber-700">People</p><h1 className="mt-2 text-4xl font-semibold">Tutors and students</h1><p className="mt-2 text-slate-600">Every login uses a real email address scoped to this organization.</p></div><div className="flex gap-2"><a href="/api/people/students/import-template?format=csv" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">CSV template</a><a href="/api/people/students/import-template?format=xlsx" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">XLSX template</a></div></div>
  {message && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{message}</div>}{temporaryPassword && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-semibold text-emerald-900">One-time temporary password</p><code className="mt-2 block break-all text-lg">{temporaryPassword}</code><button onClick={() => setTemporaryPassword(null)} className="mt-2 text-sm font-semibold text-emerald-800">I have copied it</button></div>}
  <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]"><section className="space-y-5"><form onSubmit={createPerson} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold">Add a member</h2><div className="mt-4 grid gap-3">{(["firstName", "lastName", "email"] as const).map((field) => <input key={field} required type={field === "email" ? "email" : "text"} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} placeholder={field === "firstName" ? "First name" : field === "lastName" ? "Last name" : "Email"} className="rounded-xl border border-slate-300 px-3 py-2"/>)}<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value, cohortIds: [] })} className="rounded-xl border border-slate-300 px-3 py-2"><option value="student">Student</option><option value="tutor">Tutor</option></select>{form.role === "student" && <div><p className="mb-2 text-xs font-semibold uppercase text-slate-500">Cohorts</p>{cohorts.map((cohort) => <label key={cohort.id} className="mr-3 inline-flex items-center gap-1 text-sm"><input type="checkbox" checked={form.cohortIds.includes(cohort.id)} onChange={(event) => setForm({ ...form, cohortIds: event.target.checked ? [...form.cohortIds, cohort.id] : form.cohortIds.filter((id) => id !== cohort.id) })}/>{cohort.name}</label>)}</div>}<button disabled={busy} className="rounded-xl bg-slate-950 px-4 py-2 font-semibold text-white disabled:opacity-50">Create member</button></div></form><label className="block rounded-2xl border border-dashed border-slate-300 bg-white p-6"><span className="font-semibold">Import students</span><span className="mt-1 block text-sm text-slate-600">CSV or XLSX, maximum 3 MB. Enable surname passwords in Settings first.</span><input type="file" accept=".csv,.xlsx" disabled={busy} onChange={(event) => event.target.files?.[0] && importStudents(event.target.files[0])} className="mt-4 block w-full text-sm"/></label></section>
  <section><div className="mb-4 flex gap-3"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2"/><select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2"><option value="">All roles</option><option value="student">Students</option><option value="tutor">Tutors</option></select></div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-4">Member</th><th className="p-4">Role / cohorts</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead><tbody>{people.map((person) => <tr key={person.id} className="border-t border-slate-100"><td className="p-4"><p className="font-semibold">{person.firstName} {person.lastName}</p><p className="text-slate-500">{person.email}</p></td><td className="p-4 capitalize"><p>{person.role}</p><p className="text-xs text-slate-500">{person.studentProfile?.cohortMemberships.map((item) => item.cohort.name).join(", ") || "—"}</p></td><td className="p-4">{person.isActive ? "Active" : "Inactive"}{person.mustChangePassword && <span className="block text-xs text-amber-700">Password change required</span>}</td><td className="p-4"><div className="flex flex-wrap gap-2"><button onClick={() => resetPassword(person)} className="font-semibold text-amber-700">Reset password</button><button onClick={() => setStatus(person)} className="font-semibold text-slate-600">{person.isActive ? "Deactivate" : "Reactivate"}</button>{person.role === "student" && <button onClick={() => anonymizeStudent(person)} className="font-semibold text-red-700">Anonymize</button>}</div></td></tr>)}</tbody></table>{people.length === 0 && <p className="p-8 text-center text-slate-500">No members match these filters.</p>}</div></section></div></div></main>;
}
