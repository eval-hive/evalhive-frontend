"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Monitor } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { attemptHeaders, saveAttemptSession } from "@/lib/attempt";

const navItems = [
  { name: "My assessments", href: "/student/dashboard", icon: Monitor },
];

export default function StudentDashboard() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [transfer, setTransfer] = useState<{
    attemptId: string;
    title: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  async function load() {
    const response = await api.get("/attempts/assigned");
    setAssessments(response.data.assessments);
  }
  useEffect(() => {
    load().catch(() => setMessage("Could not load your assigned assessments."));
  }, []);
  function deviceLabel() {
    return `${navigator.platform || "Browser"} · ${navigator.userAgent.slice(0, 80)}`;
  }
  async function openAssessment(assessment: any) {
    setBusy(true);
    setMessage("");
    try {
      const attemptId = assessment.attempt?.id;
      const response = await api.post(
        `/attempts/assessments/${assessment.id}/start`,
        { deviceLabel: deviceLabel() },
        { headers: attemptId ? attemptHeaders(attemptId) : {} },
      );
      const id = response.data.attempt.id;
      saveAttemptSession(
        id,
        response.data.attemptSessionToken,
        response.data.nextIntegritySequence,
      );
      router.push(`/student/exam/${id}`);
    } catch (error: any) {
      if (error.response?.data?.requiresTransfer)
        setTransfer({
          attemptId: error.response.data.attemptId,
          title: assessment.title,
        });
      else
        setMessage(
          error.response?.data?.error || "Could not open this assessment.",
        );
    } finally {
      setBusy(false);
    }
  }
  async function confirmTransfer() {
    if (!transfer) return;
    setBusy(true);
    try {
      const response = await api.post(
        `/attempts/${transfer.attemptId}/transfer`,
        { confirmTransfer: true, deviceLabel: deviceLabel() },
      );
      saveAttemptSession(
        transfer.attemptId,
        response.data.attemptSessionToken,
        response.data.nextIntegritySequence,
      );
      router.push(`/student/exam/${transfer.attemptId}`);
    } catch (error: any) {
      setMessage(
        error.response?.data?.error || "Could not transfer the attempt.",
      );
      setTransfer(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <DashboardLayout navItems={navItems} title="My assessments" role="Student">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-brand-gold">
          Eval Hive
        </p>
        <h1 className="mt-3 text-3xl font-bold text-text-primary">
          Your assessments
        </h1>
        <p className="mt-2 text-text-secondary">
          Assignments from all your cohorts and direct invitations appear once
          here.
        </p>
        {message && (
          <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
            {message}
          </p>
        )}
        {transfer && (
          <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <h2 className="font-semibold text-amber-950">
              Transfer active attempt?
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              {transfer.title} is open on another device. Transferring preserves
              every saved answer and immediately prevents the previous device
              from making changes.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                disabled={busy}
                onClick={confirmTransfer}
                className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Transfer to this device
              </button>
              <button
                onClick={() => setTransfer(null)}
                className="text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {assessments.map((assessment) => (
            <article
              key={assessment.id}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    {assessment.title}
                  </h2>
                  <p className="mt-2 text-sm text-text-secondary">
                    {assessment.itemCount} items ·{" "}
                    {assessment.durationMinutes
                      ? `${assessment.durationMinutes} minutes`
                      : "No duration limit"}
                  </p>
                </div>
                <CalendarClock className="h-5 w-5 text-brand-gold" />
              </div>
              <p className="mt-4 text-sm capitalize text-text-secondary">
                {assessment.attempt
                  ? `Attempt: ${assessment.attempt.status.replace("_", " ")} · grading ${assessment.attempt.gradingStatus.replace("_", " ")}`
                  : assessment.availability}
              </p>
              {assessment.attempt?.resultPublishedAt ? (
                <button onClick={() => router.push(`/student/result/${assessment.attempt.id}`)} className="mt-5 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">View result</button>
              ) : (
                <button
                  disabled={busy || (!assessment.attempt && assessment.availability !== "available") || (assessment.attempt && !["in_progress", "reopened"].includes(assessment.attempt.status))}
                  onClick={() => openAssessment(assessment)}
                  className="mt-5 rounded-xl bg-brand-indigo px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {["in_progress", "reopened"].includes(assessment.attempt?.status) ? "Resume assessment" : assessment.attempt ? "Awaiting published result" : "Start assessment"}
                </button>
              )}
            </article>
          ))}
          {assessments.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-text-secondary">
              No assessments are assigned to you yet.
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}
