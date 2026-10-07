"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Check, CheckCheck, Eye, EyeOff, ImagePlus, Loader2, Mail, Trash2, UsersRound } from "lucide-react";
import api from "@/lib/api";
import styles from "./register.module.css";

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 63);

export default function RegisterPage() {
  const [form, setForm] = useState({ adminFirstName: "", adminLastName: "", email: "", password: "", organizationName: "", slug: "", termsAccepted: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [created, setCreated] = useState<{ name: string; slug: string; email: string; token?: string; emailDelivered: boolean } | null>(null);
  const [resendMessage, setResendMessage] = useState("");
  const [resending, setResending] = useState(false);

  const update = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!logo) {
      setLogoPreview("");
      return;
    }
    const preview = URL.createObjectURL(logo);
    setLogoPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [logo]);

  function chooseLogo(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Organization logo must be a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Organization logo must be 2 MB or smaller.");
      return;
    }
    setError("");
    setLogo(file);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      let signupBody: typeof form | FormData = form;
      let requestConfig = {};
      if (logo) {
        const data = new FormData();
        for (const [key, value] of Object.entries(form)) data.append(key, String(value));
        data.append("logo", logo);
        signupBody = data;
        requestConfig = { headers: { "Content-Type": "multipart/form-data" } };
      }
      const response = await api.post("/organizations/signup", signupBody, requestConfig);
      setCreated({ name: response.data.organization.name, slug: response.data.organization.slug, email: form.email, token: response.data.devVerificationToken, emailDelivered: Boolean(response.data.emailDelivered) });
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || "Unable to create the organization right now.");
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    if (!created || resending) return;
    setResending(true);
    setResendMessage("");
    try {
      const response = await api.post(`/auth/resend-verification?organization=${encodeURIComponent(created.slug)}`, { email: created.email, slug: created.slug });
      setCreated((current) => current ? { ...current, token: response.data.devToken || current.token } : current);
      setResendMessage(response.data.message);
    } catch (requestError: any) {
      setResendMessage(requestError.response?.data?.error || "Unable to request another verification email yet.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className={styles.page}>
      <aside className={styles.story} aria-label="Welcome to Eval Hive">
        <a href="https://evalhive.ng" className={styles.brand} aria-label="Eval Hive website"><Image src="/images/Logo.png" alt="Eval Hive" width={144} height={48} priority/></a>
        <div className={styles.storyContent}>
          <p className={styles.eyebrow}><span/> BUILT FOR THE WAY YOU TEACH</p>
          <h2>Your people. <br/>Your ideas. <br/><em>Your own space.</em></h2>
          <p className={styles.storyDescription}>Bring your organization’s assessments, tutors, and learners together. Make room for what comes next.</p>
          <div className={styles.photoFrame}>
            <Image src="/images/registration/mentoring.webp" alt="An educator and adult learners reviewing their work together" fill sizes="(max-width: 900px) 100vw, 45vw" priority/>
            <span className={styles.photoLabel}>DIFFERENT JOURNEYS. SHARED POSSIBILITY.</span>
            <span className={styles.star} aria-hidden="true">✳</span>
          </div>
          <div className={styles.photoNote}><span><CheckCheck size={22}/></span><div><strong>More than a score.</strong><p>A clearer picture of progress.</p></div></div>
          <div className={styles.benefits}><span><UsersRound size={15}/> Flexible cohorts</span><span><Check size={15}/> Thoughtful feedback</span></div>
        </div>
        <a href="https://evalhive.ng" className={styles.backLink}><ArrowLeft size={14}/> Back to Eval Hive</a>
      </aside>

      <section className={styles.formSide}>
        <div className={styles.topLink}>Already have a workspace? <Link href="/login">Sign in <ArrowUpRight size={14}/></Link></div>
        {created ? (
          <div className={styles.success} aria-live="polite">
            <div className={styles.mailIcon}><Mail size={32}/></div>
            <p className={styles.eyebrow}>ONE LAST STEP</p>
            <h1>Let’s make it <em>official.</em></h1>
            <p className={styles.intro}>Your organization, <strong>{created.name}</strong>, is reserved. Verify your administrator email to activate your workspace.</p>
            <div className={styles.emailCard}><Mail size={20}/><div><strong>Check your email</strong><span>{created.email}</span></div></div>
            {!created.emailDelivered && <p className={styles.deliveryNote}>If the verification email hasn’t arrived, request another below.</p>}
            {created.token && <Link href={`/verify-email?token=${encodeURIComponent(created.token)}&organization=${encodeURIComponent(created.slug)}`} className={styles.submit}>Verify development account <ArrowUpRight size={18}/></Link>}
            <button type="button" disabled={resending} onClick={resendVerification} className={styles.resend}>{resending ? <><Loader2 size={15} className={styles.spinner}/> Sending…</> : "Resend verification email"}</button>
            {resendMessage && <p role="status" className={styles.resendMessage}>{resendMessage}</p>}
            <p className={styles.successFootnote}>Your workspace activates after verification. Then you can invite your team and add your organization’s branding.</p>
          </div>
        ) : (
          <div className={styles.formWrap}>
            <p className={styles.eyebrow}><span/> YOUR NEXT CHAPTER STARTS HERE</p>
            <h1>Make room for<br/><em>what’s possible.</em></h1>
            <p className={styles.intro}>Create your organization’s workspace.<br/>Verify your email, then start making learning visible.</p>

            <form onSubmit={submit} className={styles.form} aria-busy={loading}>
              <fieldset disabled={loading}>
                <legend><span>01</span> Your organization</legend>
                <label className={styles.field}>Organization name<input required autoComplete="organization" placeholder="e.g. Northstar Learning Studio" value={form.organizationName} onChange={(event) => { const value = event.target.value; setForm(current => ({ ...current, organizationName: value, slug: !current.slug || current.slug === slugify(current.organizationName) ? slugify(value) : current.slug })); }}/></label>
                <label className={styles.field}>Workspace address<div className={styles.address}><input required minLength={3} maxLength={63} aria-describedby="workspace-help" autoCapitalize="none" spellCheck={false} placeholder="your-organization" value={form.slug} onChange={(event) => update("slug", slugify(event.target.value))}/><span>.evalhive.ng</span></div></label>
                <p id="workspace-help" className={styles.helper}>Your team’s unique address. Use 3–63 letters, numbers, or hyphens.</p>
                <div className={styles.logoField}>
                  <div className={styles.logoPreview}>{logoPreview ? <Image src={logoPreview} alt="Organization logo preview" fill unoptimized/> : <ImagePlus size={22}/>}</div>
                  <div className={styles.logoCopy}><strong>Organization logo <span>Optional</span></strong><p>JPG, PNG, or WebP · Maximum 2 MB</p><label className={styles.logoButton}>Choose logo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseLogo(event.target.files?.[0])}/></label>{logo && <button type="button" className={styles.removeLogo} onClick={() => setLogo(null)}><Trash2 size={13}/> Remove</button>}</div>
                </div>
              </fieldset>

              <fieldset disabled={loading}>
                <legend><span>02</span> Your administrator account</legend>
                <div className={styles.nameGrid}>
                  <label className={styles.field}>First name<input required autoComplete="given-name" placeholder="First name" value={form.adminFirstName} onChange={(event) => update("adminFirstName", event.target.value)}/></label>
                  <label className={styles.field}>Last name<input required autoComplete="family-name" placeholder="Last name" value={form.adminLastName} onChange={(event) => update("adminLastName", event.target.value)}/></label>
                </div>
                <label className={styles.field}>Administrator email<input required type="email" autoComplete="email" placeholder="you@organization.com" value={form.email} onChange={(event) => update("email", event.target.value)}/></label>
                <label className={styles.field} htmlFor="registration-password">Password</label>
                <div className={styles.password}><input id="registration-password" required type={showPassword ? "text" : "password"} minLength={10} autoComplete="new-password" aria-describedby="password-help" placeholder="Create a secure password" value={form.password} onChange={(event) => update("password", event.target.value)}/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
                <p id="password-help" className={styles.helper}>At least 10 characters. Make it unique to this account.</p>
              </fieldset>

              <div className={styles.terms}><input id="registration-terms" required type="checkbox" checked={form.termsAccepted} onChange={(event) => update("termsAccepted", event.target.checked)} disabled={loading}/><label htmlFor="registration-terms">I agree to the <a href="https://evalhive.ng/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and acknowledge the <a href="https://evalhive.ng/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</label></div>
              {error && <p role="alert" className={styles.error}>{error}</p>}
              <button type="submit" disabled={loading} className={styles.submit}>{loading ? <><Loader2 size={18} className={styles.spinner}/> Creating your workspace…</> : <>Create organization <ArrowUpRight size={19}/></>}</button>
              <p className={styles.formFootnote}><Check size={13}/> Ready to use after email verification.</p>
            </form>
          </div>
        )}
        <footer className={styles.footer}><span>© {new Date().getFullYear()} Eval Hive</span><a href="https://evalhive.ng/contact">Need a hand? Get in touch <ArrowUpRight size={12}/></a></footer>
      </section>
    </main>
  );
}
