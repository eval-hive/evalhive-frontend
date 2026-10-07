"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function VerifyEmailPage() {
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState("Verifying your email…");
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [organization, setOrganization] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
    setOrganization(params.get("organization"));
  }, []);

  useEffect(() => {
    if (token === undefined) return;
    if (!token) {
      setState("error");
      setMessage("The verification link is incomplete.");
      return;
    }
    api.post(`/auth/verify-email${organization ? `?organization=${encodeURIComponent(organization)}` : ""}`, { token })
      .then((response) => { setState("done"); setMessage(response.data.message); })
      .catch((error) => { setState("error"); setMessage(error.response?.data?.error || "Verification failed."); });
  }, [organization, token]);

  return <AuthCard title={state === "done" ? "Workspace activated" : state === "error" ? "Verification unavailable" : "One moment"} message={message}>
    {state !== "working" ? <Link href={`/login${organization ? `?organization=${encodeURIComponent(organization)}` : ""}`} className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">Continue to sign in</Link> : null}
  </AuthCard>;
}

function AuthCard({ title, message, children }: { title: string; message: string; children?: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center bg-[#f5f7fb] px-5"><section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-9 text-center shadow-xl shadow-slate-200/60"><h1 className="text-3xl font-semibold">{title}</h1><p className="mt-3 leading-7 text-slate-600">{message}</p>{children}</section></main>;
}
