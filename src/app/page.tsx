import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface overflow-hidden">
      {/* Mesh gradient background */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />

      {/* Header */}
      <header className="relative flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-black text-primary tracking-tight">InvoiceSnap</h1>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="text-on-surface-variant px-4 py-2 rounded-full text-sm font-bold hover:bg-surface-container transition-all"
          >
            כניסה
          </Link>
          <Link
            href="/signup"
            className="bg-primary text-on-primary px-5 py-2 rounded-full text-sm font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            התחל בחינם
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative max-w-6xl mx-auto px-6">
        <section className="flex flex-col items-center text-center pt-16 pb-20">
          {/* Badge */}
          <div className="animate-fade-in bg-primary-container/30 border border-primary/10 rounded-full px-4 py-1.5 mb-6">
            <span className="text-sm font-bold text-primary">חדש! זיהוי אוטומטי בעברית</span>
          </div>

          {/* Main heading */}
          <h2 className="animate-slide-up text-5xl md:text-6xl font-black tracking-tighter text-on-surface mb-6 leading-tight">
            קבלות?
            <br />
            <span className="gradient-primary bg-clip-text text-transparent">סגרנו את העניין.</span>
          </h2>

          <p className="animate-slide-up text-lg md:text-xl text-on-surface-variant max-w-lg mb-10" style={{ animationDelay: "0.1s" }}>
            צלם קבלה, האפליקציה מזהה הכל אוטומטית.
            מסודר, מגובה, ומוכן לרואה חשבון בקליק.
          </p>

          <div className="animate-slide-up flex gap-3" style={{ animationDelay: "0.2s" }}>
            <Link
              href="/signup"
              className="gradient-primary text-white px-8 py-3.5 rounded-full text-base font-bold hover:shadow-xl hover:shadow-primary/25 transition-all active:scale-95"
            >
              התחל בחינם
            </Link>
            <Link
              href="#features"
              className="glass border border-outline-variant/50 text-on-surface px-8 py-3.5 rounded-full text-base font-bold hover:bg-surface-container transition-all active:scale-95"
            >
              איך זה עובד?
            </Link>
          </div>

          {/* Mock phone preview */}
          <div className="animate-scale-in mt-16 w-full max-w-sm mx-auto" style={{ animationDelay: "0.3s" }}>
            <div className="bg-surface-container-lowest rounded-[2rem] shadow-2xl shadow-primary/10 border border-outline-variant/30 p-3 mx-auto">
              <div className="bg-surface rounded-[1.5rem] overflow-hidden">
                {/* Mock status bar */}
                <div className="flex justify-between items-center px-4 py-2 text-[10px] text-on-surface-variant">
                  <span>12:34</span>
                  <div className="flex gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>signal_cellular_alt</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>wifi</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>battery_full</span>
                  </div>
                </div>
                {/* Mock app content */}
                <div className="px-4 py-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="w-8 h-8 rounded-full bg-surface-container-highest" />
                    <span className="text-xs font-black text-primary">InvoiceSnap</span>
                    <div className="w-8 h-8" />
                  </div>
                  <div className="bg-surface-container-lowest rounded-2xl p-4">
                    <p className="text-[10px] text-on-surface-variant">סיכום חודשי</p>
                    <p className="text-2xl font-black tracking-tighter">₪12,450</p>
                    <span className="text-[8px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold">+12%</span>
                  </div>
                  <div className="bg-primary-container rounded-2xl p-4">
                    <p className="text-[10px] text-on-primary-container opacity-80">מע״מ לניכוי</p>
                    <p className="text-lg font-black text-on-primary-container">₪1,806</p>
                  </div>
                  {[
                    { name: "סופר-פארם", amount: "₪142", icon: "shopping_cart" },
                    { name: "פז גלילות", amount: "₪320", icon: "local_gas_station" },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center gap-3 bg-surface-container-lowest rounded-xl p-3">
                      <div className="w-8 h-8 bg-surface-container-high rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>{item.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold">{item.name}</p>
                      </div>
                      <p className="text-xs font-black">{item.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20">
          <h3 className="text-3xl font-black text-on-surface text-center mb-4">
            פשוט עובד. בלי סיפורים.
          </h3>
          <p className="text-on-surface-variant text-center mb-12 max-w-md mx-auto">
            שלושה צעדים פשוטים מצילום הקבלה ועד רואה החשבון
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "photo_camera",
                title: "1. צלם",
                desc: "מצלם את הקבלה. סכום, תאריך וספק מזוהים אוטומטית - כולל עברית.",
                gradient: "from-blue-500/10 to-blue-600/5",
              },
              {
                icon: "auto_awesome",
                title: "2. מסודר",
                desc: "הכל נשמר, מקוטלג, ומגובה אוטומטית ל-Google Drive בתיקייה מסודרת.",
                gradient: "from-emerald-500/10 to-emerald-600/5",
              },
              {
                icon: "send",
                title: "3. שלח",
                desc: "בסוף החודש - קליק אחד ואת כל החומר אצל רואה החשבון. מייל, WhatsApp או Drive.",
                gradient: "from-amber-500/10 to-amber-600/5",
              },
            ].map((f) => (
              <div
                key={f.icon}
                className={`bg-gradient-to-br ${f.gradient} border border-outline-variant/30 rounded-3xl p-8 hover:scale-[1.02] transition-all duration-300`}
              >
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-white text-2xl">{f.icon}</span>
                </div>
                <h4 className="text-xl font-black text-on-surface mb-2">{f.title}</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="py-16">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "3", unit: "שניות", label: "זמן סריקה" },
                { value: "17%", unit: "", label: "מע״מ לניכוי" },
                { value: "4", unit: "דרכים", label: "לשלוח לרו\"ח" },
                { value: "24/7", unit: "", label: "עובד אופליין" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-3xl md:text-4xl font-black text-primary tracking-tighter">
                    {s.value}<span className="text-lg">{s.unit}</span>
                  </p>
                  <p className="text-sm text-on-surface-variant mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <h3 className="text-3xl md:text-4xl font-black text-on-surface mb-4">
            מוכן להפסיק לאבד כסף?
          </h3>
          <p className="text-on-surface-variant mb-8 max-w-md mx-auto">
            הצטרף עכשיו בחינם. בלי כרטיס אשראי. בלי התחייבות.
          </p>
          <Link
            href="/signup"
            className="gradient-primary text-white px-10 py-4 rounded-full text-lg font-bold inline-flex items-center gap-2 hover:shadow-xl hover:shadow-primary/25 transition-all active:scale-95 animate-pulse-glow"
          >
            <span className="material-symbols-outlined">rocket_launch</span>
            התחל בחינם
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-outline-variant/30 py-8 text-center">
        <p className="text-xs text-outline">InvoiceSnap &copy; {new Date().getFullYear()} | ניהול קבלות חכם לעצמאים</p>
      </footer>
    </div>
  );
}
