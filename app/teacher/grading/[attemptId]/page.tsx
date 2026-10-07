"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  FileText,
  GraduationCap,
  LockKeyhole,
  Send,
  Download,
  AlertTriangle,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import MathText from "@/components/MathText";
import api from "@/lib/api";

const navItems = [
  { name: "My Dashboard", href: "/teacher/dashboard", icon: BookOpen },
  { name: "Authoring", href: "/teacher/authoring", icon: FileText },
  { name: "Grading", href: "/teacher/grading", icon: GraduationCap },
  { name: "Integrity", href: "/teacher/integrity", icon: Clock },
];

export default function GradeAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = use(params);
  const [attempt, setAttempt] = useState<any>(null);
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [message, setMessage] = useState("");
  async function load() {
    const response = await api.get(`/grading/attempts/${attemptId}`);
    setAttempt(response.data.attempt);
    const values: Record<string, any> = {};
    for (const item of response.data.attempt.items)
      if (item.type !== "multiple_choice")
        values[item.id] = {
          marks: item.grade?.marks ?? "",
          privateNote: item.grade?.privateNote || "",
          studentFeedback: item.grade?.studentFeedback || "",
        };
    setDrafts(values);
  }
  useEffect(() => {
    load().catch(() => setMessage("Could not load this submission."));
  }, [attemptId]);
  async function save(itemId: string, status: "draft" | "finalized") {
    try {
      const response = await api.put(`/grading/items/${itemId}`, {
        ...drafts[itemId],
        status,
      });
      setMessage(
        status === "finalized"
          ? "Grade finalized and total recalculated."
          : "Draft grade saved privately.",
      );
      setAttempt((current: any) => ({
        ...current,
        gradingStatus: response.data.attempt.gradingStatus,
        score: response.data.attempt.score,
        resultPublishedAt: response.data.attempt.resultPublishedAt,
      }));
      await load();
    } catch (error: any) {
      setMessage(error.response?.data?.error || "Could not save this grade.");
    }
  }
  async function publish() {
    try {
      await api.post(`/grading/attempts/${attemptId}/publish`);
      setMessage("Result published to the student.");
      await load();
    } catch (error: any) {
      setMessage(
        error.response?.data?.error || "Could not publish this result.",
      );
    }
  }
  async function downloadFile(fileId: string) {
    try {
      const response = await api.post(`/submissions/files/${fileId}/download-link`);
      window.location.assign(response.data.url);
    } catch (error: any) {
      setMessage(error.response?.data?.error || "Could not authorize this download.");
    }
  }
  if (!attempt)
    return (
      <main className="min-h-screen bg-background p-10">
        {message || "Loading submission…"}
      </main>
    );
  return (
    <DashboardLayout
      navItems={navItems}
      title="Grade submission"
      role="Subject Teacher"
    >
      <section>
        <Link
          href="/teacher/grading"
          className="text-sm font-semibold text-brand-gold"
        >
          ← Grading queue
        </Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-brand-gold">
              {attempt.assessment.title}
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              {attempt.student.firstName} {attempt.student.lastName}
            </h1>
            <p className="mt-2 text-text-secondary">
              {attempt.score} / {attempt.maximumScore} marks ·{" "}
              <span className="capitalize">
                {attempt.gradingStatus.replace("_", " ")}
              </span>
            </p>
          </div>
          <button
            onClick={publish}
            disabled={
              !["complete", "not_required"].includes(attempt.gradingStatus) ||
              attempt.assessment.resultVisibility === "hidden"
            }
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            {attempt.resultPublishedAt ? "Published" : "Publish result"}
          </button>
        </div>
        {attempt.assessment.resultVisibility === "hidden" && (
          <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            Result publication is disabled because this assessment is configured
            to hide results.
          </p>
        )}
        {message && (
          <p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
            {message}
          </p>
        )}
        <div className="mt-8 space-y-5">
          {attempt.items.map((item: any, index: number) => (
            <article
              id={`item-${item.id}`}
              key={item.id}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-brand-gold">
                    Item {index + 1} · {item.type.replace("_", " ")}
                  </p>
                  <div className="mt-2 text-lg font-semibold">
                    <MathText>{item.prompt}</MathText>
                  </div>
                </div>
                <p className="shrink-0 font-semibold">
                  {item.maximumPoints} marks
                </p>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <section className="rounded-xl bg-background-alt p-4">
                  <p className="text-xs font-semibold uppercase text-text-secondary">
                    Student response
                  </p>
                  {item.type === "multiple_choice" ? (
                    <p className="mt-2">
                      Automatically scored: {item.response?.autoScore || 0} /{" "}
                      {item.maximumPoints}
                    </p>
                  ) : item.type === "written_answer" ? (
                    <p className="mt-2 whitespace-pre-wrap">
                      {item.response?.writtenText || "No answer submitted"}
                    </p>
                  ) : item.type === "url_submission" ? (
                    item.response?.submittedUrl ? (
                      <a
                        className="mt-2 block break-all text-brand-indigo underline"
                        href={item.response.submittedUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.response.submittedUrl}
                      </a>
                    ) : (
                      <p className="mt-2">No URL submitted</p>
                    )
                  ) : (
                    <div className="mt-2 space-y-2">
                      {item.response?.files?.length ? item.response.files.map((file: any) => (
                        <button key={file.id} onClick={() => downloadFile(file.id)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm font-medium text-brand-indigo">
                          <span className="truncate">{file.name}</span><Download className="h-4 w-4 shrink-0" />
                        </button>
                      )) : <p>No files submitted</p>}
                      <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900"><AlertTriangle className="mr-1 inline h-4 w-4" />Student-submitted code can be unsafe. Open or run it only in a sandbox.</p>
                    </div>
                  )}
                </section>
                <section className="rounded-xl bg-background-alt p-4">
                  <p className="text-xs font-semibold uppercase text-text-secondary">
                    Marking guide
                  </p>
                  <p className="mt-2">
                    <strong>Model answer:</strong>{" "}
                    {item.modelAnswer || "Not provided"}
                  </p>
                  <p className="mt-2">
                    <strong>Rubric:</strong> {item.rubric || "Not provided"}
                  </p>
                </section>
              </div>
              {item.type !== "multiple_choice" && (
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <label className="text-sm font-medium">
                    Marks
                    <input
                      type="number"
                      min="0"
                      max={Number(item.maximumPoints)}
                      step="0.01"
                      value={drafts[item.id]?.marks ?? ""}
                      onChange={(event) =>
                        setDrafts({
                          ...drafts,
                          [item.id]: {
                            ...drafts[item.id],
                            marks: event.target.value,
                          },
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-border px-3 py-2"
                    />
                  </label>
                  <label className="text-sm font-medium">
                    Private grader note{" "}
                    <LockKeyhole className="inline h-4 w-4" />
                    <textarea
                      value={drafts[item.id]?.privateNote || ""}
                      onChange={(event) =>
                        setDrafts({
                          ...drafts,
                          [item.id]: {
                            ...drafts[item.id],
                            privateNote: event.target.value,
                          },
                        })
                      }
                      className="mt-2 min-h-24 w-full rounded-xl border border-border px-3 py-2"
                    />
                  </label>
                  <label className="text-sm font-medium">
                    Student feedback
                    <textarea
                      value={drafts[item.id]?.studentFeedback || ""}
                      onChange={(event) =>
                        setDrafts({
                          ...drafts,
                          [item.id]: {
                            ...drafts[item.id],
                            studentFeedback: event.target.value,
                          },
                        })
                      }
                      className="mt-2 min-h-24 w-full rounded-xl border border-border px-3 py-2"
                    />
                  </label>
                  <div className="flex gap-3 md:col-span-3">
                    <button
                      onClick={() => save(item.id, "draft")}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
                    >
                      Save draft
                    </button>
                    <button
                      onClick={() => save(item.id, "finalized")}
                      className="rounded-lg bg-brand-indigo px-4 py-2 text-sm font-semibold text-white"
                    >
                      {item.grade?.status === "finalized"
                        ? "Finalize regrade"
                        : "Finalize grade"}
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
        {attempt.auditHistory.length > 0 && (
          <section className="mt-8 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold">Audit history</h2>
            <div className="mt-4 space-y-2 text-sm text-text-secondary">
              {attempt.auditHistory.map((event: any) => (
                <p key={event.id}>
                  {new Date(event.createdAt).toLocaleString()} ·{" "}
                  {event.action.replaceAll("_", " ")} ·{" "}
                  {event.actor
                    ? `${event.actor.firstName} ${event.actor.lastName}`
                    : "System"}
                </p>
              ))}
            </div>
          </section>
        )}
      </section>
    </DashboardLayout>
  );
}
