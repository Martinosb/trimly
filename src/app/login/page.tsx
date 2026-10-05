"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Scissors, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.09C3.27 21.36 7.35 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32 0-.83.13-1.6.38-2.32V6.59H1.26C.46 8.18 0 9.99 0 12c0 2.01.46 3.82 1.26 5.41l4.02-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.26 6.59l4.02 3.09c.95-2.83 3.6-4.93 6.72-4.93z"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  // Sync error query param if redirected back with error
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setMessage({ type: "error", text: decodeURIComponent(errorParam) });
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    setMessage(null);

    try {
      const nextParam = searchParams.get("next");
      const nextDestination = nextParam || (mode === "signup" ? "/onboard" : "/dashboard");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextDestination)}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in with Google";
      setMessage({ type: "error", text: msg });
      setOauthLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboard`,
          },
        });

        if (error) throw error;

        if (data.session) {
          router.push("/onboard");
        } else {
          setMessage({
            type: "success",
            text: "Account created! Please check your email inbox to confirm your registration.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check if user is platform admin or has a shop
        if (email.toLowerCase().includes("moseiboakye@st.knust.edu.gh")) {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  // Quick autofill helper for seamless testing
  const handleQuickLogin = (demoEmail: string, demoPass: string = "Password123!") => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setMode("login");
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-0 sm:p-4 font-sans text-[#222222]">
      {/* Container / Airbnb Sheet Modal */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-0 sm:rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden relative border border-[#ebebeb]">
        {/* Header */}
        <header className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-[#f0f0f0] relative">
          <Link
            href="/"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#222222] hover:bg-[#f7f7f7] transition-colors"
          >
            <span className="text-xl">✕</span>
          </Link>

          {/* GxStyl Logo */}
          <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <div className="w-8 h-8 rounded-full bg-[#ff385c]/10 flex items-center justify-center text-[#ff385c]">
              <Scissors className="w-4 h-4 fill-current rotate-45" />
            </div>
            <span className="font-bold text-xl tracking-tight text-[#222222]">GxStyl</span>
          </div>

          <div className="w-9" />
        </header>

        {/* Content Body */}
        <main className="px-6 py-6 flex-1 flex flex-col justify-start">
          {/* Tabs */}
          <div className="flex border-b border-[#ebebeb] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setMessage(null);
              }}
              className={`pb-3 font-semibold text-base transition-colors relative flex-1 text-center ${
                mode === "login"
                  ? "text-[#222222] border-b-2 border-[#ff385c]"
                  : "text-[#717171] hover:text-[#222222]"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setMessage(null);
              }}
              className={`pb-3 font-semibold text-base transition-colors relative flex-1 text-center ${
                mode === "signup"
                  ? "text-[#222222] border-b-2 border-[#ff385c]"
                  : "text-[#717171] hover:text-[#222222]"
              }`}
            >
              Sign up
            </button>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-[#222222]">
              {mode === "login" ? "Welcome back" : "Create your shop account"}
            </h1>
            <p className="text-sm text-[#717171] mt-1">
              {mode === "login"
                ? "Manage appointments, staff chairs, and revenue."
                : "Join Ghana's top barbers and salons on GxStyl."}
            </p>
          </div>

          {message && (
            <div
              className={`mb-5 p-3.5 rounded-xl flex items-start gap-2.5 text-sm ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Google Sign In Option */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || oauthLoading}
            className="w-full py-3.5 px-4 rounded-xl border border-[#dddddd] hover:border-[#222222] hover:bg-[#fafafa] active:scale-[0.98] text-[#222222] font-semibold text-sm shadow-xs transition-all duration-150 flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none mb-5"
          >
            {oauthLoading ? (
              <div className="w-5 h-5 border-2 border-[#222222]/30 border-t-[#222222] rounded-full animate-spin" />
            ) : (
              <>
                <GoogleIcon className="w-5 h-5 shrink-0" />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#ebebeb]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-[#717171] font-semibold tracking-wider">
                or with email
              </span>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-[#222222] uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kojo Mensah"
                    className="w-full px-4 py-3 rounded-xl border border-[#dddddd] text-sm focus:outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c] transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#222222] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-[#dddddd] text-sm focus:outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#222222] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-[#dddddd] text-sm focus:outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || oauthLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#ff385c] hover:bg-[#e00b41] active:scale-[0.98] text-white font-semibold text-sm shadow-sm transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === "login" ? "Log in" : "Create Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials helper (Only in local development) */}
          {process.env.NODE_ENV !== "production" && (
            <div className="mt-8 pt-5 border-t border-[#f0f0f0]">
              <p className="text-xs font-medium text-[#717171] mb-2 text-center">
                Development demo shortcuts:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("info@gentlemenscut.com")}
                  className="text-xs py-2 px-2.5 rounded-lg border border-[#dddddd] hover:border-[#222222] bg-white font-medium text-[#222222] transition-colors text-left truncate"
                >
                  ✂ Demo Shop Owner
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("moseiboakye@st.knust.edu.gh")}
                  className="text-xs py-2 px-2.5 rounded-lg border border-[#dddddd] hover:border-[#222222] bg-white font-medium text-[#222222] transition-colors text-left truncate"
                >
                  ⚡ Platform Admin
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 bg-[#fafafa] border-t border-[#f0f0f0] text-center text-xs text-[#717171]">
          By continuing, you agree to GxStyl&apos;s{" "}
          <Link href="/terms" className="underline hover:text-[#222222] transition-colors">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-[#222222] transition-colors">
            Privacy Policy
          </Link>.
        </footer>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-4">
          <div className="w-8 h-8 border-2 border-[#ff385c] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
