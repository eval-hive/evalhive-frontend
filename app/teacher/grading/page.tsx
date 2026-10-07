"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";

const navItems = [
  { name: "My Dashboard", href: "/teacher/dashboard", icon: BookOpen },
  { name: "Authoring", href: "/teacher/authoring", icon: FileText },
  { name: "Grading", href: "/teacher/grading", icon: GraduationCap },
  { name: "Integrity", href: "/teacher/integrity", icon: Clock },
];

export default function GradingQueuePage() {
  const [queue, setQueue] = useState<any>({ byStudent: [], byItem: [] });
  const [view, setView] = useState<"student" | "item">("student");
  const [message, setMessage] = useState("");
  useEffect(() => {
    api
      .get("/grading/queue")
      .then((response) => setQueue(response.data.queue))
      .catch(() => setMessage("Could not load the grading queue."));
  }, []);
  return (
    <DashboardLayout navItems={navItems} title="Grading" role="Subject Teacher">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-brand-gold">
          Grading
        </p>
        <h1 className="mt-3 text-3xl font-bold text-text-primary">
          Submission queue
        </h1>
        <p className="mt-2 text-text-secondary">
          Review by learner or compare submissions for the same assessment item.
        </p>
        {message && (
          <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm">{message}</p>
        )}
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setView("student")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === "student" ? "bg-brand-indigo text-white" : "border border-border bg-card"}`}
          >
            By student
          </button>
          <button
            onClick={() => setView("item")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === "item" ? "bg-brand-indigo text-white" : "border border-border bg-card"}`}
          >
            By item
          </button>
        </div>
        {view === "student" ? (
          <div className="mt-6 grid gap-4">
            {queue.byStudent.map((row: any) => (
              <Link
                key={row.attemptId}
                href={`/teacher/grading/${row.attemptId}`}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-brand-indigo"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-text-primary">
                      {row.student.firstName} {row.student.lastName}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {row.assessment.title} · {row.student.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="capitalize font-semibold">
                      {row.gradingStatus.replace("_", " ")}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {row.pendingItems} of {row.totalManualItems} awaiting
                      final grade
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            {queue.byStudent.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-text-secondary">
                No submitted work is waiting for review.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {queue.byItem.map((item: any) => (
              <article
                key={item.assessmentItemId}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <p className="text-xs font-semibold uppercase text-brand-gold">
                  {item.assessment.title} · {item.type.replace("_", " ")}
                </p>
                <p className="mt-2 font-semibold">{item.prompt}</p>
                <p className="mt-1 text-sm text-text-secondary">
                  {item.maximumPoints} marks · {item.submissions.length}{" "}
                  submissions
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.submissions.map((submission: any) => (
                    <Link
                      key={submission.attemptItemId}
                      href={`/teacher/grading/${submission.attemptId}#item-${submission.attemptItemId}`}
                      className="rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span>
                        {submission.student.firstName}{" "}
                        {submission.student.lastName}
                      </span>
                      {submission.gradeStatus === "finalized" ? (
                        <CheckCircle2 className="ml-2 inline h-4 w-4 text-emerald-600" />
                      ) : null}
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
