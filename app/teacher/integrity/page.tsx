"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";

const navItems = [
  { name: "Authoring", href: "/teacher/authoring", icon: ShieldCheck },
  { name: "Integrity", href: "/teacher/integrity", icon: AlertTriangle },
];

export default function IntegrityPage() {
  const [assessments, setAssessments] = useState<any[]>([]); const [assessmentId, setAssessmentId] = useState(""); const [attempts, setAttempts] = useState<any[]>([]); const [message, setMessage] = useState("");
  useEffect(() => { api.get("/authoring/assessments").then((response) => { setAssessments(response.data.assessments); if (response.data.assessments[0]) setAssessmentId(response.data.assessments[0].id); }).catch(() => setMessage("Could not load assessments.")); }, []);
  useEffect(() => { if (!assessmentId) return; api.get(`/attempts/assessment/${assessmentId}/integrity-summaries`).then((response) => setAttempts(response.data.attempts)).catch(() => setMessage("Could not load integrity summaries.")); }, [assessmentId]);
  return <DashboardLayout navItems={navItems} title="Integrity review" role="Subject Tutor"><section><p className="text-sm font-semibold uppercase tracking-[.2em] text-brand-gold">Integrity</p><h1 className="mt-3 text-3xl font-bold text-text-primary">Attempt activity</h1><p className="mt-2 text-text-secondary">Leave events and device transfers support review; they never terminate an attempt by themselves.</p>{message && <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm">{message}</p>}<select value={assessmentId} onChange={(event) => setAssessmentId(event.target.value)} className="mt-6 w-full max-w-xl rounded-xl border border-border bg-card px-4 py-3"><option value="">Choose an assessment</option>{assessments.map((assessment) => <option key={assessment.id} value={assessment.id}>{assessment.title}</option>)}</select><div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card"><table className="w-full text-left text-sm"><thead className="bg-background-alt text-text-secondary"><tr><th className="p-4">Student</th><th className="p-4">Status</th><th className="p-4">Leave events</th><th className="p-4">Transfers</th><th className="p-4">Review</th></tr></thead><tbody>{attempts.map((attempt) => <tr key={attempt.id} className="border-t border-border"><td className="p-4"><p className="font-semibold">{attempt.student.firstName} {attempt.student.lastName}</p><p className="text-xs text-text-secondary">{attempt.student.email}</p></td><td className="p-4 capitalize">{attempt.status.replace("_", " ")}</td><td className="p-4">{attempt.leaveEvents}</td><td className="p-4">{attempt.transfers}</td><td className="p-4">{attempt.isIntegrityFlagged ? <span className="inline-flex items-center gap-1 font-semibold text-amber-700"><AlertTriangle className="h-4 w-4"/>Flagged</span> : <span className="inline-flex items-center gap-1 text-emerald-700"><ShieldCheck className="h-4 w-4"/>No flag</span>}</td></tr>)}</tbody></table>{attempts.length === 0 && <p className="p-8 text-center text-text-secondary">No attempts have started for this assessment.</p>}</div></section></DashboardLayout>;
}
