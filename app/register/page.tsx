"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Mail,
  Phone,
  School,
  ShieldCheck,
} from "lucide-react";
import api from "@/lib/api";

const RESERVED_SLUGS = new Set(["www", "app", "api", "admin", "__superadmin"]);
const MAX_LOGO_SIZE = 2 * 1024 * 1024;

type RegistrationResponse = {
  message: string;
  domain: string;
  school: {
    name: string;
    slug: string;
    logoUrl?: string | null;
    subscriptionStatus: string;
  };
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

function validateSlug(slug: string) {
  if (!slug) return "Enter a school slug.";
  if (RESERVED_SLUGS.has(slug))
    return "This slug is reserved. Choose another one.";
  if (!/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/.test(slug)) {
    return "Use 3-63 lowercase letters, numbers, or hyphens. Do not start or end with a hyphen.";
  }
  return "";
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: "",
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<RegistrationResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slugError = useMemo(() => validateSlug(form.slug), [form.slug]);
  const domainPreview = `${form.slug || "your-school"}.evalhive.ng`;

  const updateName = (name: string) => {
    setForm((current) => ({
      ...current,
      name,
      slug: slugTouched ? current.slug : slugify(name),
    }));
  };

  const updateSlug = (value: string) => {
    setSlugTouched(true);
    setForm((current) => ({ ...current, slug: slugify(value) }));
  };

  const updateLogo = (file: File | null) => {
    setError("");
    if (!file) {
      setLogo(null);
      setLogoPreview(null);
      return;
    }

    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      setError("School logo must be a JPG, PNG, WebP, or GIF image.");
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setError("School logo must be 2MB or smaller.");
      return;
    }

    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (slugError) {
      setError(slugError);
      return;
    }

    if (form.adminPassword.length < 8) {
      setError("Admin password must be at least 8 characters.");
      return;
    }

    if (form.adminPassword !== form.confirmPassword) {
      setError("Admin passwords do not match.");
      return;
    }

    if (!/^[+\d][\d\s().-]{6,24}$/.test(form.contactPhone.trim())) {
      setError("Enter a valid school phone number.");
      return;
    }

    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("slug", form.slug);
    payload.append("address", form.address.trim());
    payload.append("contactEmail", form.contactEmail.trim());
    payload.append("contactPhone", form.contactPhone.trim());
    payload.append("adminEmail", form.adminEmail.trim());
    payload.append("adminPassword", form.adminPassword);
    if (logo) payload.append("logo", logo);

    setIsSubmitting(true);
    try {
      const res = await api.post("/schools/register", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(res.data);
    } catch (err: any) {
      const message = err.response?.data?.suggestion
        ? `${err.response.data.error}. Try ${err.response.data.suggestion}.`
        : err.response?.data?.error ||
          "Registration could not be submitted. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
        <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl items-center justify-center">
          <div className="w-full rounded-lg border border-border bg-card p-8 text-center shadow-2xl shadow-brand-indigo/10 sm:p-12">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-brand-emerald/10 text-brand-emerald">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-gold">
              Registration submitted
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-text-primary">
              {success.school.name} is waiting for approval.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-text-secondary">
              Eval Hive will review this school account manually. Once approved,
              the school admin account will be activated and the school will
              receive a free 7-day trial before subscription enforcement is
              introduced.
            </p>
            <div className="mx-auto mt-6 max-w-md rounded-lg border border-border bg-background px-4 py-3 text-sm text-text-secondary">
              Your school domain will be{" "}
              <span className="font-bold text-brand-indigo">
                {success.domain}
              </span>
            </div>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-brand-indigo px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-indigo/20 transition-colors hover:bg-brand-indigo/95"
            >
              Back to login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-10">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] w-full overflow-hidden rounded-lg border border-border bg-card shadow-2xl shadow-brand-indigo/10 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="hidden bg-brand-indigo p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-gold text-sm font-black text-brand-indigo">
                EH
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">Eval Hive</p>
                <p className="text-xs font-medium text-white/60">
                  School CBT Suite
                </p>
              </div>
            </div>
            <div className="mt-24 max-w-md">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-gold">
                School onboarding
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight">
                Create your school portal and start with a reviewed trial.
              </h1>
              <p className="mt-5 text-base leading-7 text-white/70">
                Register your school, reserve your subdomain, and prepare a
                school admin account for approval.
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-5 text-sm leading-6 text-white/75">
            Approved schools receive a 7-day free trial. Billing rules will be
            connected in the subscription phase.
          </div>
        </aside>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-2xl">
            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-indigo/10 text-brand-indigo">
                <School className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-text-primary">
                Register your school
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Submit the school details for manual approval by Eval Hive.
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-start rounded-lg border border-brand-red/20 bg-brand-red/10 p-4">
                <AlertCircle className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-brand-red" />
                <p className="text-sm text-brand-red">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                <label className="group flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-background p-2 transition-colors hover:border-brand-indigo">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="School logo preview"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-brand-indigo">
                      <ImagePlus className="mx-auto h-6 w-6" />
                      <span className="mt-1 block text-[11px] font-semibold">
                        Logo
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={(event) =>
                      updateLogo(event.target.files?.[0] || null)
                    }
                  />
                </label>
                <div className="flex flex-col justify-center">
                  <p className="text-sm font-semibold text-text-primary">
                    School logo
                  </p>
                  <p className="mt-1 text-sm leading-6 text-text-secondary">
                    Upload a JPG, PNG, WebP, or GIF image. Maximum size is 2MB.
                    The logo will display inside a fixed square on the school
                    login page.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="school-name"
                    className="mb-1 block text-sm font-semibold text-text-primary"
                  >
                    School Name
                  </label>
                  <input
                    id="school-name"
                    required
                    value={form.name}
                    onChange={(event) => updateName(event.target.value)}
                    className="block w-full rounded-lg border border-border bg-background px-3 py-3 text-sm text-text-primary outline-none transition-colors focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20"
                    placeholder="Alma Mater College"
                  />
                </div>
                <div>
                  <label
                    htmlFor="slug"
                    className="mb-1 block text-sm font-semibold text-text-primary"
                  >
                    School Slug
                  </label>
                  <input
                    id="slug"
                    required
                    value={form.slug}
                    onChange={(event) => updateSlug(event.target.value)}
                    className="block w-full rounded-lg border border-border bg-background px-3 py-3 text-sm text-text-primary outline-none transition-colors focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20"
                    placeholder="alma-mater"
                  />
                  <p
                    className={`mt-1 text-xs ${slugError ? "text-brand-red" : "text-text-secondary"}`}
                  >
                    Your school domain will be{" "}
                    <span className="font-semibold">{domainPreview}</span>
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="mb-1 block text-sm font-semibold text-text-primary"
                  >
                    Contact Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={form.contactEmail}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          contactEmail: event.target.value,
                        }))
                      }
                      className="block w-full rounded-lg border border-border bg-background py-3 pl-10 pr-3 text-sm text-text-primary outline-none transition-colors focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20"
                      placeholder="info@school.edu.ng"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="contact-phone"
                    className="mb-1 block text-sm font-semibold text-text-primary"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
                    <input
                      id="contact-phone"
                      type="tel"
                      required
                      value={form.contactPhone}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          contactPhone: event.target.value,
                        }))
                      }
                      className="block w-full rounded-lg border border-border bg-background py-3 pl-10 pr-3 text-sm text-text-primary outline-none transition-colors focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20"
                      placeholder="+234 801 234 5678"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="address"
                    className="mb-1 block text-sm font-semibold text-text-primary"
                  >
                    School Address
                  </label>
                  <input
                    id="address"
                    value={form.address}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    className="block w-full rounded-lg border border-border bg-background px-3 py-3 text-sm text-text-primary outline-none transition-colors focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20"
                    placeholder="Lagos, Nigeria"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background p-4">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-brand-indigo" />
                  <h3 className="text-sm font-bold text-text-primary">
                    Initial School Admin
                  </h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="admin-email"
                      className="mb-1 block text-sm font-semibold text-text-primary"
                    >
                      Admin Email
                    </label>
                    <input
                      id="admin-email"
                      type="email"
                      required
                      value={form.adminEmail}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          adminEmail: event.target.value,
                        }))
                      }
                      className="block w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-text-primary outline-none transition-colors focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20"
                      placeholder="admin@school.edu.ng"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="admin-password"
                      className="mb-1 block text-sm font-semibold text-text-primary"
                    >
                      Temporary Password
                    </label>
                    <input
                      id="admin-password"
                      type="password"
                      required
                      minLength={8}
                      value={form.adminPassword}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          adminPassword: event.target.value,
                        }))
                      }
                      className="block w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-text-primary outline-none transition-colors focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20"
                      placeholder="At least 8 characters"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="confirm-password"
                      className="mb-1 block text-sm font-semibold text-text-primary"
                    >
                      Confirm Temporary Password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      required
                      minLength={8}
                      value={form.confirmPassword}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      className="block w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-text-primary outline-none transition-colors focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20"
                      placeholder="Repeat temporary password"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-lg bg-brand-indigo px-4 cursor-pointer py-3 text-sm font-bold text-white shadow-lg shadow-brand-indigo/20 transition-colors hover:bg-brand-indigo/95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting registration...
                  </>
                ) : (
                  <>
                    Submit school registration
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* <p className="mt-6 text-center text-sm text-text-secondary">
              Already approved?{' '}
              <Link href="/login" className="font-semibold text-brand-indigo hover:text-brand-indigo/80">
                Sign in
              </Link>
            </p> */}
          </div>
        </div>
      </section>
    </main>
  );
}
