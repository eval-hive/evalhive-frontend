"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [organization, setOrganization] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
    setOrganization(params.get("organization"));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirm) return setError("Passwords do not match");
    try {
      const response = await api.post(`/auth/reset-password${organization ? `?organization=${encodeURIComponent(organization)}` : ""}`, { token, password });
      setMessage(response.data.message);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || "Reset failed.");
    }
  }

  return <main className="grid min-h-screen place-items-center bg-[#f5f7fb] px-5"><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl"><h1 className="text-3xl font-semibold">Choose a new password</h1>{message ? <><p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p><Link href={`/login${organization ? `?organization=${encodeURIComponent(organization)}` : ""}`} className="mt-5 inline-block font-semibold">Return to sign in</Link></> : <form onSubmit={submit} className="mt-7 space-y-4"><input required minLength={10} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="w-full rounded-xl border border-slate-200 px-4 py-3"/><input required minLength={10} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" className="w-full rounded-xl border border-slate-200 px-4 py-3"/>{error ? <p className="text-sm text-red-700">{error}</p> : null}<button className="w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white">Reset password</button></form>}</section></main>;
}
