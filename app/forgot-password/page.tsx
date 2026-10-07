"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { getOrganizationSlugClient } from "@/lib/tenant";

export default function ForgotPasswordPage() {
  const [slug, setSlug] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [devToken, setDevToken] = useState("");

  useEffect(() => {
    setSlug(getOrganizationSlugClient());
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const response = await api.post(`/auth/forgot-password${slug ? `?organization=${encodeURIComponent(slug)}` : ""}`, { email });
    setMessage(response.data.message);
    setDevToken(response.data.devToken || "");
  }

  return <main className="grid min-h-screen place-items-center bg-[#f5f7fb] px-5"><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl"><h1 className="text-3xl font-semibold">Reset your password</h1><p className="mt-3 text-sm leading-6 text-slate-600">Enter the email for this workspace. The response is intentionally the same whether an account exists or not.</p><form onSubmit={submit} className="mt-7 space-y-4"><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"/><button className="w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white">Request reset</button></form>{message ? <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p> : null}{devToken ? <Link href={`/reset-password?token=${encodeURIComponent(devToken)}${slug ? `&organization=${encodeURIComponent(slug)}` : ""}`} className="mt-4 inline-block text-sm font-semibold text-amber-700">Open development reset link</Link> : null}</section></main>;
}
