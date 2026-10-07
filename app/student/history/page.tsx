"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { History, Monitor } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
const navItems = [{ name: "My assessments", href: "/student/dashboard", icon: Monitor }, { name: "Result history", href: "/student/history", icon: History }];
export default function StudentHistoryPage() {
  const [history, setHistory] = useState<any[]>([]); const [message, setMessage] = useState("");
  useEffect(() => { api.get("/analytics/student-history").then((response) => setHistory(response.data.history)).catch(() => setMessage("Could not load your result history.")); }, []);
  return <DashboardLayout navItems={navItems} title="Result history" role="Student"><div><h1 className="text-3xl font-bold">Published result history</h1><p className="mt-2 text-text-secondary">Only results released by your tutor appear here.</p>{message && <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm">{message}</p>}<div className="mt-7 space-y-4">{history.map((row) => <article key={row.attemptId} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5"><div><h2 className="font-semibold">{row.assessment.title}</h2><p className="mt-1 text-sm text-text-secondary">Published {new Date(row.resultPublishedAt).toLocaleDateString()}</p></div><div className="text-right"><p className="text-xl font-bold">{row.score} / {row.maximumScore} <span className="text-sm text-text-secondary">({row.percentage}%)</span></p><div className="mt-2 flex gap-3"><Link href={`/student/result/${row.attemptId}`} className="font-semibold text-brand-indigo">View result</Link><button onClick={() => window.location.assign(`/api/analytics/attempts/${row.attemptId}/report.pdf`)} className="font-semibold text-emerald-700">PDF</button></div></div></article>)}{!history.length && !message && <p className="rounded-xl border border-dashed border-border p-8 text-center text-text-secondary">No published results yet.</p>}</div></div></DashboardLayout>;
}
