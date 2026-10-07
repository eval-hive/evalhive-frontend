"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Hexagon, LockKeyhole, Mail } from "lucide-react";
import api from "@/lib/api";
import { loginAuth, User } from "@/lib/auth";
import { getOrganizationSlugClient } from "@/lib/tenant";

function dashboardFor(user: User) {
  if (user.mustChangePassword) return "/change-password";
  if (user.role === "super_admin") return "/admin/platform";
  if (user.role === "organization_admin") return "/admin/organization";
  if (user.role === "tutor") return "/teacher/dashboard";
  return "/student/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const [slug, setSlug] = useState<string | null>(null);
  const [tenantReady, setTenantReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState<{ name: string; slug: string; logoUrl?: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const tenantQuery = slug ? `?organization=${encodeURIComponent(slug)}` : "";

  useEffect(() => {
    setSlug(getOrganizationSlugClient());
    setTenantReady(true);
  }, []);

  useEffect(() => {
    if (!tenantReady) return;
    if (slug) {
      api.get(`/organizations/resolve/${slug}${tenantQuery}`)
        .then((response) => setOrganization(response.data.organization))
        .catch(() => setError("This organization workspace is unavailable."));
    }
    api.get(`/auth/me${tenantQuery}`)
      .then((response) => {
        loginAuth(response.data.user);
        router.replace(dashboardFor(response.data.user));
      })
      .catch(() => {});
  }, [router, slug, tenantQuery, tenantReady]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.post(`/auth/login${tenantQuery}`, { email, password });
      loginAuth(response.data.user);
      router.push(dashboardFor(response.data.user));
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || "Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-10 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-200/70 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3 text-lg font-semibold"><Hexagon className="h-7 w-7 text-amber-400" /> Eval Hive</div>
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-amber-400">Independent assessment</p>
            <h1 className="max-w-lg text-5xl font-semibold leading-tight">Assess clearly. Grade thoughtfully. Keep every learner in view.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">A focused assessment workspace for tutors, bootcamps, summer schools, and online education teams.</p>
          </div>
          <p className="text-sm text-slate-400">Each organization has an isolated workspace and independent accounts.</p>
        </section>

        <section className="flex items-center p-7 sm:p-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-9">
              {organization?.logoUrl ? <img src={organization.logoUrl} alt="" className="mb-5 h-14 w-14 rounded-2xl object-contain" /> : null}
              <p className="text-sm font-semibold text-amber-700">{organization?.name || "Eval Hive platform"}</p>
              <h2 className="mt-2 text-3xl font-semibold">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Sign in with the email and password for this workspace.</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <label className="block text-sm font-medium text-slate-700">
                Email
                <span className="mt-2 flex items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:border-slate-500">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full border-0 bg-transparent px-3 py-3 outline-none" autoComplete="email" />
                </span>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Password
                <span className="mt-2 flex items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:border-slate-500">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full border-0 bg-transparent px-3 py-3 outline-none" autoComplete="current-password" />
                </span>
              </label>
              {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
              <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                {loading ? "Signing in…" : "Sign in"}<ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm">
              <Link href={`/forgot-password${tenantQuery}`} className="font-medium text-slate-700 hover:text-slate-950">Forgot password?</Link>
              {!slug ? <Link href="/register" className="font-medium text-amber-700 hover:text-amber-800">Create an organization</Link> : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
