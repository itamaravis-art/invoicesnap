import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Hero */}
      <header className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-black text-primary tracking-tight">InvoiceSnap</h1>
        <Link
          href="/login"
          className="bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-bold hover:bg-primary/90 transition-all active:scale-95"
        >
          התחברות
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-on-primary-container">photo_camera</span>
        </div>
        <h2 className="text-4xl font-black tracking-tighter text-on-surface mb-4">
          קבלות? סגרנו את העניין.
        </h2>
        <p className="text-lg text-on-surface-variant max-w-md mb-8">
          צלם, ארגן ושלח קבלות לרואה חשבון בקליק אחד.
          זיהוי אוטומטי, גיבוי לגוגל דרייב, ומצב אופליין.
        </p>
        <div className="flex gap-3">
          <Link
            href="/signup"
            className="bg-primary text-on-primary px-8 py-3 rounded-full text-base font-bold hover:bg-primary/90 transition-all active:scale-95"
          >
            התחל בחינם
          </Link>
          <Link
            href="/login"
            className="border-2 border-outline text-on-surface px-8 py-3 rounded-full text-base font-bold hover:bg-surface-container transition-all active:scale-95"
          >
            כניסה
          </Link>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-3xl w-full">
          {[
            { icon: "document_scanner", title: "זיהוי אוטומטי", desc: "סכום, תאריך וספק - כולל עברית" },
            { icon: "cloud_upload", title: "גיבוי לדרייב", desc: "כל קבלה נשמרת אוטומטית בתיקייה מסודרת" },
            { icon: "send", title: "שליחה בקליק", desc: "מייל, WhatsApp או שיתוף Drive לרואה חשבון" },
          ].map((f) => (
            <div key={f.icon} className="bg-surface-container-lowest rounded-3xl p-6 text-start">
              <span className="material-symbols-outlined text-3xl text-primary mb-3 block">{f.icon}</span>
              <h3 className="font-bold text-on-surface mb-1">{f.title}</h3>
              <p className="text-sm text-on-surface-variant">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-outline">
        InvoiceSnap &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
