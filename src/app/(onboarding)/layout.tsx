export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-black text-primary tracking-tight text-center mb-8">InvoiceSnap</h1>
        {children}
      </div>
    </div>
  );
}
