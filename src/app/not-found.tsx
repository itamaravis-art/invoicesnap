import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center">
      <span className="material-symbols-outlined text-6xl text-outline mb-4">search_off</span>
      <h2 className="text-3xl font-black text-on-surface mb-2">404</h2>
      <p className="text-on-surface-variant mb-6">העמוד שחיפשת לא נמצא</p>
      <Link
        href="/dashboard"
        className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold"
      >
        חזרה לדאשבורד
      </Link>
    </div>
  );
}
