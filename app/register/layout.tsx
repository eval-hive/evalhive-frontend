import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

const manrope = Manrope({ subsets: ["latin"], variable: "--registration-body", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--registration-display", display: "swap" });

export const metadata: Metadata = {
  title: "Create your organization | Eval Hive",
  description: "Bring your teaching, your learners, and your assessments into an Eval Hive workspace of your own.",
};

export default function RegistrationLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${manrope.variable} ${sora.variable}`}>{children}</div>;
}
