export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface" dir="rtl" lang="he">
      <header className="bg-primary text-on-primary px-6 py-4 flex items-center gap-3">
        <span className="material-symbols-outlined">shield</span>
        <div>
          <h1 className="text-lg font-black">InvoiceSnap</h1>
          <p className="text-xs opacity-80">{"\u05E4\u05D5\u05E8\u05D8\u05DC \u05E8\u05D5\u05D0\u05D4 \u05D7\u05E9\u05D1\u05D5\u05DF"}</p>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
