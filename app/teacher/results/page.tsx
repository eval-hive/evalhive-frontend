"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, BookOpen, Clock, FileText, GraduationCap } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";

const navItems = [{ name: "My Dashboard", href: "/teacher/dashboard", icon: BookOpen }, { name: "Authoring", href: "/teacher/authoring", icon: FileText }, { name: "Grading", href: "/teacher/grading", icon: GraduationCap }, { name: "Results", href: "/teacher/results", icon: BarChart3 }, { name: "Integrity", href: "/teacher/integrity", icon: Clock }];
export default function ResultsPage() {
  const [assessments, setAssessments] = useState<any[]>([]); const [message, setMessage] = useState("");
  useEffect(() => { api.get("/analytics/assessments").then((response) => setAssessments(response.data.assessments)).catch(() => setMessage("Could not load assessment results.")); }, []);
  return <DashboardLayout navItems={navItems} title="Results" role="Subject Teacher"><div><p className="text-sm font-semibold uppercase tracking-[.18em] text-brand-gold">Analytics</p><h1 className="mt-2 text-3xl font-bold">Assessment results</h1><p className="mt-2 text-text-secondary">Completion, grading, published marks, cohort performance, and exports.</p>{message && <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm">{message}</p>}<div className="mt-7 grid gap-4 lg:grid-cols-2">{assessments.map((assessment) => <Link key={assessment.id} href={`/teacher/results/${assessment.id}`} className="rounded-xl border border-border bg-card p-5 hover:border-brand-indigo/40"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{assessment.title}</h2><p className="mt-1 text-sm capitalize text-text-secondary">{assessment.status} · {assessment.resultVisibility.replaceAll("_", " ")}</p></div><span className="text-xl font-bold text-brand-indigo">{assessment.averagePerformance === null ? "—" : `${assessment.averagePerformance}%`}</span></div><div className="mt-4 grid grid-cols-3 gap-3 text-sm"><span>{assessment.attemptCount} attempts</span><span>{assessment.pendingGrading} pending</span><span>{assessment.publishedResults} published</span></div></Link>)}{!assessments.length && !message && <p className="text-text-secondary">No assessments available yet.</p>}</div></div></DashboardLayout>;
}
