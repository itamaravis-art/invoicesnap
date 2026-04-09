"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("אימייל או סיסמה שגויים");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/callback` },
    });
    if (error) setError("שגיאה בהתחברות עם גוגל");
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-primary tracking-tight mb-2">InvoiceSnap</h1>
        <p className="text-on-surface-variant">התחבר לחשבון שלך</p>
      </div>

      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 border-2 border-outline-variant rounded-xl px-4 py-3 font-bold text-on-surface hover:bg-surface-container transition-all active:scale-[0.98]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        התחבר עם Google
      </button>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-outline-variant" />
        <span className="text-xs text-outline">או</span>
        <div className="flex-1 h-px bg-outline-variant" />
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-bold text-on-surface-variant">אימייל</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="your@email.com"
            dir="ltr"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-bold text-on-surface-variant">סיסמה</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="••••••••"
            dir="ltr"
          />
        </div>

        {error && <p className="text-sm text-error font-medium text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-on-primary py-3 rounded-full font-bold text-base hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "מתחבר..." : "התחברות"}
        </button>
      </form>

      <p className="text-center text-sm text-on-surface-variant">
        אין לך חשבון?{" "}
        <Link href="/signup" className="text-primary font-bold hover:underline">
          הרשם עכשיו
        </Link>
      </p>
    </div>
  );
}
