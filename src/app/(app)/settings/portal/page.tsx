"use client";

import { useState, useEffect, useCallback } from "react";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

interface ShareToken {
  id: string;
  token: string;
  expires_at: string;
  access_count: number;
  last_accessed_at: string | null;
  accountant?: { name: string; email: string | null } | null;
}

export default function PortalSettingsPage() {
  const [tokens, setTokens] = useState<ShareToken[]>([]);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState("");

  const fetchTokens = useCallback(async () => {
    const res = await fetch("/api/portal/tokens");
    if (res.ok) {
      const data = await res.json();
      setTokens(data.tokens || []);
    }
  }, []);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  async function createToken() {
    setCreating(true);
    try {
      const res = await fetch("/api/portal/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 30 }),
      });
      if (res.ok) fetchTokens();
    } finally { setCreating(false); }
  }

  async function revokeToken(id: string) {
    if (!confirm("\u05DC\u05D1\u05D8\u05DC \u05D0\u05EA \u05D4\u05E7\u05D9\u05E9\u05D5\u05E8? \u05E8\u05D5\u05D0\u05D4 \u05D4\u05D7\u05E9\u05D1\u05D5\u05DF \u05DC\u05D0 \u05D9\u05D5\u05DB\u05DC \u05DC\u05D2\u05E9\u05EA \u05D3\u05E8\u05DB\u05D5.")) return;
    await fetch(`/api/portal/tokens/${id}`, { method: "DELETE" });
    fetchTokens();
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/portal/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(""), 2000);
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-black text-on-surface">{"\u05E4\u05D5\u05E8\u05D8\u05DC \u05E8\u05D5\u05D0\u05D4 \u05D7\u05E9\u05D1\u05D5\u05DF"}</h2>
      <p className="text-sm text-on-surface-variant">
        {"\u05E6\u05D5\u05E8 \u05E7\u05D9\u05E9\u05D5\u05E8 \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7 \u05DB\u05D3\u05D9 \u05DC\u05D0\u05E4\u05E9\u05E8 \u05DC\u05E8\u05D5\u05D0\u05D4 \u05D4\u05D7\u05E9\u05D1\u05D5\u05DF \u05E9\u05DC\u05DA \u05DC\u05E6\u05E4\u05D5\u05EA \u05D1\u05E7\u05D1\u05DC\u05D5\u05EA \u05D1\u05DC\u05D1\u05D3, \u05DC\u05DC\u05D0 \u05E6\u05D5\u05E8\u05DA \u05D1\u05D4\u05E8\u05E9\u05DE\u05D4."}
      </p>

      <button
        onClick={createToken}
        disabled={creating}
        className="w-full bg-primary text-on-primary py-3 rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
      >
        <MaterialIcon icon="add_link" size={20} />
        {creating ? "\u05D9\u05D5\u05E6\u05E8 \u05E7\u05D9\u05E9\u05D5\u05E8..." : "\u05E6\u05D5\u05E8 \u05E7\u05D9\u05E9\u05D5\u05E8 \u05D7\u05D3\u05E9"}
      </button>

      {tokens.length > 0 ? (
        <div className="space-y-3">
          {tokens.map(t => (
            <div key={t.id} className="bg-surface-container-lowest rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MaterialIcon icon="link" size={18} className="text-primary" />
                  <span className="text-sm font-bold">{t.accountant?.name || "\u05E7\u05D9\u05E9\u05D5\u05E8 \u05DB\u05DC\u05DC\u05D9"}</span>
                </div>
                <span className="text-xs text-on-surface-variant">
                  {t.access_count} {"\u05E6\u05E4\u05D9\u05D5\u05EA"}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                {"\u05EA\u05D5\u05E7\u05E3 \u05E2\u05D3"} {new Date(t.expires_at).toLocaleDateString("he-IL")}
                {t.last_accessed_at && <> &middot; {"\u05E0\u05E6\u05E4\u05D4 \u05DC\u05D0\u05D7\u05E8\u05D5\u05E0\u05D4"} {new Date(t.last_accessed_at).toLocaleDateString("he-IL")}</>}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => copyLink(t.token)}
                  className="flex-1 bg-surface-container py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1"
                >
                  <MaterialIcon icon={copied === t.token ? "check" : "content_copy"} size={16} />
                  {copied === t.token ? "\u05D4\u05D5\u05E2\u05EA\u05E7!" : "\u05D4\u05E2\u05EA\u05E7 \u05E7\u05D9\u05E9\u05D5\u05E8"}
                </button>
                <button
                  onClick={() => revokeToken(t.id)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-error bg-error-container"
                >
                  {"\u05D1\u05D8\u05DC"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-3xl p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-outline mb-2 block">share</span>
          <p className="text-on-surface-variant">{"\u05D0\u05D9\u05DF \u05E7\u05D9\u05E9\u05D5\u05E8\u05D9\u05DD \u05E4\u05E2\u05D9\u05DC\u05D9\u05DD. \u05E6\u05D5\u05E8 \u05E7\u05D9\u05E9\u05D5\u05E8 \u05DB\u05D3\u05D9 \u05DC\u05E9\u05EA\u05E3 \u05E2\u05DD \u05E8\u05D5\u05D0\u05D4 \u05D4\u05D7\u05E9\u05D1\u05D5\u05DF."}</p>
        </div>
      )}
    </section>
  );
}
