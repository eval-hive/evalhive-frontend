"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

type Question = {
  id: string;
  prompt: string;
  type: string;
  maximumPoints: string;
};
type Choice = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

export default function AssessmentBuilder({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [assessment, setAssessment] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [cohorts, setCohorts] = useState<Choice[]>([]);
  const [students, setStudents] = useState<Choice[]>([]);
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [cohortIds, setCohortIds] = useState<string[]>([]);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [filePrompt, setFilePrompt] = useState("");
  const [urlPrompt, setUrlPrompt] = useState("");
  const [message, setMessage] = useState("");
  async function load() {
    const [detail, banks, cohortResponse, people] = await Promise.all([
      api.get(`/authoring/assessments/${id}`),
      api.get("/authoring/banks"),
      api.get("/cohorts", { params: { active: true } }),
      api.get("/people", {
        params: { role: "student", active: true, limit: 100 },
      }),
    ]);
    setAssessment(detail.data.assessment);
    setCohorts(cohortResponse.data.cohorts);
    setStudents(people.data.people);
    setCohortIds(
      detail.data.assessment.cohortTargets.map(
        (target: any) => target.cohortId,
      ),
    );
    setStudentIds(
      detail.data.assessment.studentTargets.map(
        (target: any) => target.studentProfile.user.id,
      ),
    );
    const lists = await Promise.all(
      banks.data.banks.map((bank: any) =>
        api.get(`/authoring/banks/${bank.id}/questions`),
      ),
    );
    setQuestions(lists.flatMap((response) => response.data.questions));
  }
  useEffect(() => {
    load().catch(() => setMessage("Could not load this assessment."));
  }, [id]);
  function toggle(
    list: string[],
    setList: (value: string[]) => void,
    value: string,
  ) {
    setList(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value],
    );
  }
  async function saveItems() {
    const items: any[] = questionIds.map((sourceQuestionId) => ({
      sourceQuestionId,
    }));
    if (filePrompt.trim())
      items.push({
        type: "file_submission",
        prompt: filePrompt,
        maximumPoints: 10,
      });
    if (urlPrompt.trim())
      items.push({
        type: "url_submission",
        prompt: urlPrompt,
        maximumPoints: 10,
      });
    try {
      await api.put(`/authoring/assessments/${id}/items`, { items });
      setMessage("Assessment items saved as immutable snapshots.");
      await load();
    } catch (error: any) {
      setMessage(error.response?.data?.error || "Could not save items.");
    }
  }
  async function saveTargets() {
    try {
      await api.put(`/authoring/assessments/${id}/targets`, {
        cohortIds,
        studentUserIds: studentIds,
      });
      setMessage(
        "Targets saved. Students assigned twice will still receive one assessment.",
      );
      await load();
    } catch (error: any) {
      setMessage(error.response?.data?.error || "Could not save targets.");
    }
  }
  async function saveVisibility() {
    try {
      await api.patch(`/authoring/assessments/${id}`, {
        resultVisibility: assessment.resultVisibility,
        feedbackVisibility: assessment.feedbackVisibility || null,
      });
      setMessage("Result and feedback visibility saved.");
      await load();
    } catch (error: any) {
      setMessage(
        error.response?.data?.error || "Could not save visibility settings.",
      );
    }
  }
  async function publish() {
    try {
      await api.post(`/authoring/assessments/${id}/publish`);
      setMessage("Assessment published. Its content is now locked.");
      await load();
    } catch (error: any) {
      setMessage(
        error.response?.data?.error || "Could not publish assessment.",
      );
    }
  }
  if (!assessment)
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-10">
        Loading assessment…
      </main>
    );
  const locked = assessment.status !== "draft";
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link
          href="/teacher/authoring"
          className="text-sm font-semibold text-amber-700"
        >
          ← Authoring
        </Link>
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-amber-700">
              Assessment builder
            </p>
            <h1 className="mt-2 text-4xl font-semibold">{assessment.title}</h1>
            <p className="mt-2 capitalize text-slate-500">
              {assessment.status} · {assessment.items.length} items
            </p>
          </div>
          {!locked && (
            <button
              onClick={publish}
              className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white"
            >
              Publish assessment
            </button>
          )}
        </div>
        {message && (
          <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm">{message}</p>
        )}
        {locked && (
          <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Published content is locked. Later edits to source-bank questions
            cannot change this assessment.
          </p>
        )}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold">Result visibility</h2>
          <p className="mt-1 text-sm text-slate-500">
            Results still require an explicit publish action after grading is
            complete.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">
              Student result view
              <select
                disabled={locked}
                value={assessment.resultVisibility}
                onChange={(event) =>
                  setAssessment({
                    ...assessment,
                    resultVisibility: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2"
              >
                <option value="hidden">Hidden</option>
                <option value="marks_only">Total marks only</option>
                <option value="detailed">Detailed item marks</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Feedback visibility
              <select
                disabled={locked}
                value={assessment.feedbackVisibility || ""}
                onChange={(event) =>
                  setAssessment({
                    ...assessment,
                    feedbackVisibility: event.target.value || null,
                  })
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2"
              >
                <option value="">Use organization default</option>
                <option value="marks_only">Marks only</option>
                <option value="marks_and_feedback">
                  Marks and student feedback
                </option>
              </select>
            </label>
          </div>
          {!locked && (
            <button
              onClick={saveVisibility}
              className="mt-4 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Save visibility
            </button>
          )}
        </section>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold">Items</h2>
            <p className="mt-1 text-sm text-slate-500">
              Mix reusable questions with file and URL prompts.
            </p>
            <div className="mt-4 max-h-72 space-y-2 overflow-auto">
              {questions.map((question) => (
                <label
                  key={question.id}
                  className="flex gap-3 rounded-xl bg-slate-50 p-3"
                >
                  <input
                    disabled={locked}
                    type="checkbox"
                    checked={questionIds.includes(question.id)}
                    onChange={() =>
                      toggle(questionIds, setQuestionIds, question.id)
                    }
                  />
                  <span>
                    <span className="block text-xs font-semibold uppercase text-amber-700">
                      {question.type.replace("_", " ")} ·{" "}
                      {question.maximumPoints}
                    </span>
                    <span className="text-sm">{question.prompt}</span>
                  </span>
                </label>
              ))}
            </div>
            <textarea
              disabled={locked}
              value={filePrompt}
              onChange={(e) => setFilePrompt(e.target.value)}
              placeholder="Optional file submission prompt"
              className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2"
            />
            <textarea
              disabled={locked}
              value={urlPrompt}
              onChange={(e) => setUrlPrompt(e.target.value)}
              placeholder="Optional URL submission prompt"
              className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2"
            />
            {!locked && (
              <button
                onClick={saveItems}
                className="mt-3 rounded-xl bg-slate-950 px-4 py-2 font-semibold text-white"
              >
                Save item snapshots
              </button>
            )}
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold">Assign learners</h2>
            <p className="mt-1 text-sm text-slate-500">
              Select several cohorts and optional individual students.
            </p>
            <h3 className="mt-5 text-sm font-semibold uppercase text-slate-500">
              Cohorts
            </h3>
            <div className="mt-2 space-y-2">
              {cohorts.map((cohort) => (
                <label key={cohort.id} className="flex items-center gap-2">
                  <input
                    disabled={locked}
                    type="checkbox"
                    checked={cohortIds.includes(cohort.id)}
                    onChange={() => toggle(cohortIds, setCohortIds, cohort.id)}
                  />
                  {cohort.name}
                </label>
              ))}
            </div>
            <h3 className="mt-5 text-sm font-semibold uppercase text-slate-500">
              Individuals
            </h3>
            <div className="mt-2 max-h-64 space-y-2 overflow-auto">
              {students.map((student) => (
                <label key={student.id} className="flex items-center gap-2">
                  <input
                    disabled={locked}
                    type="checkbox"
                    checked={studentIds.includes(student.id)}
                    onChange={() =>
                      toggle(studentIds, setStudentIds, student.id)
                    }
                  />
                  {student.firstName} {student.lastName}{" "}
                  <span className="text-xs text-slate-400">
                    {student.email}
                  </span>
                </label>
              ))}
            </div>
            {!locked && (
              <button
                onClick={saveTargets}
                className="mt-4 rounded-xl bg-amber-600 px-4 py-2 font-semibold text-white"
              >
                Save targets
              </button>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
