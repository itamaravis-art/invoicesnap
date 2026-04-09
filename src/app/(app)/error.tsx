"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="material-symbols-outlined text-5xl text-error mb-4">error</span>
      <h2 className="text-xl font-black text-on-surface mb-2">משהו השתבש</h2>
      <p className="text-sm text-on-surface-variant mb-6 max-w-sm">
        {error.message || "אירעה שגיאה בלתי צפויה. נסה לרענן את הדף."}
      </p>
      <button
        onClick={reset}
        className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold active:scale-95 transition-all"
      >
        נסה שוב
      </button>
    </div>
  );
}
