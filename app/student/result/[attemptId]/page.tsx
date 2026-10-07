"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import MathText from "@/components/MathText";
import api from "@/lib/api";

export default function StudentResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = use(params);
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get(`/grading/results/${attemptId}`)
      .then((response) => setResult(response.data.result))
      .catch((error) =>
        setMessage(
          error.response?.data?.error || "This result is unavailable.",
        ),
      )
      .finally(() => setLoading(false));
  }, [attemptId]);
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-9 w-9 animate-spin text-brand-indigo" />
      </div>
    );
  return (
    <DashboardLayout
      navItems={[
        { name: "My assessments", href: "/student/dashboard", icon: FileText },
      ]}
      title="Assessment result"
      role="Student"
    >
      <section className="mx-auto max-w-4xl">
        <Link
          href="/student/dashboard"
          className="text-sm font-semibold text-brand-gold"
        >
          ← My assessments
        </Link>
        {!result ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-950">
            <h1 className="text-2xl font-bold">Result not available</h1>
            <p className="mt-2">{message}</p>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[.2em] text-brand-gold">
                Published result
              </p>
              <h1 className="mt-3 text-3xl font-bold">
                {result.assessmentTitle}
              </h1>
              <p className="mt-6 text-5xl font-bold text-brand-indigo">
                {result.score}{" "}
                <span className="text-2xl text-text-secondary">
                  / {result.maximumScore}
                </span>
              </p>
              <p className="mt-3 text-text-secondary">
                {result.maximumScore > 0
                  ? (
                      (Number(result.score) / Number(result.maximumScore)) *
                      100
                    ).toFixed(1)
                  : "0.0"}
                %
              </p>
            </div>
            {result.items.length > 0 && (
              <div className="mt-8 space-y-4">
                <h2 className="text-xl font-bold">Item breakdown</h2>
                {result.items.map((item: any, index: number) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-border bg-card p-6"
                  >
                    <p className="text-xs font-semibold uppercase text-brand-gold">
                      Item {index + 1} · {item.type.replace("_", " ")}
                    </p>
                    <div className="mt-2 font-semibold">
                      <MathText>{item.prompt}</MathText>
                    </div>
                    <p className="mt-4 text-lg font-bold">
                      {item.marks ?? 0} / {item.maximumPoints} marks
                    </p>
                    {item.studentFeedback && (
                      <div className="mt-4 rounded-xl bg-blue-50 p-4">
                        <p className="text-xs font-semibold uppercase text-blue-700">
                          Tutor feedback
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-blue-950">
                          {item.studentFeedback}
                        </p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </DashboardLayout>
  );
}
