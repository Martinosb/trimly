import React from "react";
import Link from "next/link";
import { Scissors, ArrowLeft, FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service — GxStyl",
  description: "Terms and conditions of service for GxStyl platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#222222] font-sans">
      {/* Header */}
      <header className="border-b border-[#ebebeb] bg-white sticky top-0 z-10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#ff385c] flex items-center justify-center text-white">
              <Scissors className="w-4 h-4 fill-current rotate-45" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-[#222222]">GxStyl</span>
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#717171] hover:text-[#222222] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-4 text-[#ff385c]">
          <FileText className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">User Agreement</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#222222] mb-3">
          Terms of Service
        </h1>
        <p className="text-sm text-[#717171] mb-8">
          Last updated: October 5, 2026
        </p>

        <div className="prose prose-neutral max-w-none text-sm leading-relaxed space-y-8 text-[#484848]">
          <section className="bg-white p-6 rounded-2xl border border-[#ebebeb] shadow-xs">
            <h2 className="text-lg font-bold text-[#222222] mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using GxStyl (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not access the Service.
            </p>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-[#ebebeb] shadow-xs">
            <h2 className="text-lg font-bold text-[#222222] mb-3">2. Description of Service</h2>
            <p>
              GxStyl provides barbershop and salon management software, appointment scheduling tools, chair allocation timelines, and customer booking portals. Shop owners maintain complete autonomy over their working hours, pricing, staff rosters, and cancellation policies.
            </p>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-[#ebebeb] shadow-xs">
            <h2 className="text-lg font-bold text-[#222222] mb-3">3. User Accounts & Google Authentication</h2>
            <p>
              When creating an account or signing in using Google OAuth, you agree to provide authentic and accurate credentials. You are responsible for safeguarding your login credentials and for any activities or actions conducted under your account.
            </p>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-[#ebebeb] shadow-xs">
            <h2 className="text-lg font-bold text-[#222222] mb-3">4. Appointments & Cancellation Policies</h2>
            <p>
              Appointments booked through GxStyl are subject to the specific shop&apos;s cancellation notice window and deposit rules. Clients who fail to arrive for their scheduled session or cancel outside the permitted window may forfeit their deposits as dictated by the shop owner&apos;s published policies.
            </p>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-[#ebebeb] shadow-xs">
            <h2 className="text-lg font-bold text-[#222222] mb-3">5. Termination & Inquiries</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate our community standards or engage in fraudulent booking behavior. For any questions regarding these terms, please contact{" "}
              <a href="mailto:martinosb2023@gmail.com" className="text-[#ff385c] underline font-semibold">
                martinosb2023@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
