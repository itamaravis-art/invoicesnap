"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "שגיאה, נסה שוב." }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "אין חיבור. נסה שוב." }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 start-4 z-40 bg-secondary text-on-secondary w-12 h-12 rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all animate-scale-in"
        title="שאל את InvoiceSnap AI"
        aria-label="פתח צ׳אט AI"
      >
        <span className="material-symbols-outlined">smart_toy</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 start-4 end-4 z-40 max-w-sm bg-surface rounded-3xl shadow-2xl border border-outline-variant flex flex-col animate-scale-in" style={{ maxHeight: "60vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">smart_toy</span>
          <span className="font-bold text-sm text-on-surface">InvoiceSnap AI</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-on-surface-variant">
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ minHeight: 200 }}>
        {messages.length === 0 && (
          <div className="text-center py-6">
            <span className="material-symbols-outlined text-3xl text-outline mb-2 block">chat</span>
            <p className="text-xs text-on-surface-variant">שאל אותי על ההוצאות שלך</p>
            <div className="flex flex-wrap gap-1.5 justify-center mt-3">
              {["כמה הוצאתי החודש?", "מה הקטגוריה הכי יקרה?", "תן לי טיפ לחיסכון"].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-xs bg-surface-container px-3 py-1.5 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-primary text-on-primary rounded-ee-sm"
                : "bg-surface-container text-on-surface rounded-es-sm"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-container px-4 py-2 rounded-2xl rounded-es-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-outline rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-outline rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-outline rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-outline-variant">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="שאל על ההוצאות שלך..."
            className="flex-1 px-4 py-2.5 rounded-full bg-surface-container-low border border-outline-variant text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
            dir="rtl"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-secondary text-on-secondary w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-lg">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
