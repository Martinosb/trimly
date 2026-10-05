import React from "react";
import Link from "next/link";
import { Scissors, ArrowLeft, Shield } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — GxStyl",
  description: "Privacy Policy and data protection terms for GxStyl platform users and clients.",
};

export default function PrivacyPolicyPage() {
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
          <Shield className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Legal & Compliance</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#222222] mb-3">
          Privacy Policy
        </h1>
        <p className="text-sm text-[#717171] mb-8">
          Last updated: October 5, 2026
        </p>

        <div className="prose prose-neutral max-w-none text-sm leading-relaxed space-y-8 text-[#484848]">
          <section className="bg-white p-6 rounded-2xl border border-[#ebebeb] shadow-xs">
            <h2 className="text-lg font-bold text-[#222222] mb-3">1. Introduction</h2>
            <p>
              GxStyl (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the GxStyl appointment scheduling, chair management, and salon booking platform. We are committed to protecting the privacy, accuracy, and security of personal information collected from barbers, salon owners, staff, and clients.
            </p>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-[#ebebeb] shadow-xs">
            <h2 className="text-lg font-bold text-[#222222] mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>Account Information:</strong> When signing in with Google or creating an account, we collect your verified name, email address, and profile identifier provided by Google OAuth.
              </li>
              <li>
                <strong>Shop & Staff Information:</strong> Shop name, addresses, telephone numbers, service menus, prices, and staff chair allocations.
              </li>
              <li>
                <strong>Booking & Appointment Records:</strong> Client names, phone numbers, booking dates, appointment time windows, and optional service notes.
              </li>
              <li>
                <strong>Payment Information:</strong> Mobile Money and card transaction references handled securely through licensed payment processors (Paystack and Hubtel). We never store raw debit/credit card numbers or Mobile Money PINs.
              </li>
            </ul>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-[#ebebeb] shadow-xs">
            <h2 className="text-lg font-bold text-[#222222] mb-3">3. How We Use Google User Data</h2>
            <p>
              When you authenticate with Google Sign-In, GxStyl requests only basic identity scopes (<code className="bg-[#f0f0f0] px-1 py-0.5 rounded">openid</code>, <code className="bg-[#f0f0f0] px-1 py-0.5 rounded">email</code>, <code className="bg-[#f0f0f0] px-1 py-0.5 rounded">profile</code>). This data is strictly used to:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Authenticate your identity securely without requiring a separate password.</li>
              <li>Pre-populate your shop profile and account administrator records.</li>
              <li>Send critical booking notifications, confirmations, and security alerts.</li>
            </ul>
            <p className="mt-2 text-[#717171]">
              We do not sell, rent, or share Google user data with third-party advertisers or unauthorized intermediaries.
            </p>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-[#ebebeb] shadow-xs">
            <h2 className="text-lg font-bold text-[#222222] mb-3">4. Data Storage & Security</h2>
            <p>
              Your data is encrypted in transit using TLS 1.3 and stored with row-level security (RLS) enforcement on Supabase PostgreSQL infrastructure. Access to administrative controls is restricted and authenticated.
            </p>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-[#ebebeb] shadow-xs">
            <h2 className="text-lg font-bold text-[#222222] mb-3">5. User Rights & Contact</h2>
            <p>
              You may request access to, correction of, or deletion of your personal account data at any time by contacting our support team at{" "}
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
