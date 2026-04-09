"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

interface Category {
  id: string;
  name_he: string;
  color: string;
}

interface ReceiptSearchProps {
  onFilterChange: (filters: {
    search: string;
    categoryId: string | null;
    month: string | null;
    sort: "newest" | "oldest" | "amount_desc" | "amount_asc";
  }) => void;
}

export function ReceiptSearch({ onFilterChange }: ReceiptSearchProps) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "oldest" | "amount_desc" | "amount_asc">("newest");
  const [categories, setCategories] = useState<Category[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.from("categories").select("id, name_he, color").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const emitChange = useCallback(() => {
    onFilterChange({ search, categoryId, month, sort });
  }, [search, categoryId, month, sort, onFilterChange]);

  useEffect(() => { emitChange(); }, [emitChange]);

  // Generate last 12 months for picker
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("he-IL", { month: "long", year: "numeric" }),
    };
  });

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <MaterialIcon icon="search" className="absolute top-3 start-3 text-outline" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי ספק או הערה..."
            className="w-full ps-10 pe-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3 rounded-xl border transition-all ${
            showFilters || categoryId || month
              ? "bg-primary text-on-primary border-primary"
              : "bg-surface-container-low border-outline-variant text-on-surface-variant"
          }`}
        >
          <MaterialIcon icon="tune" size={20} />
        </button>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="bg-surface-container-lowest rounded-2xl p-4 space-y-3">
          {/* Category filter */}
          <div>
            <label className="text-xs font-bold text-on-surface-variant mb-1 block">קטגוריה</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryId(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  !categoryId ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
                }`}
              >
                הכל
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    categoryId === cat.id ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {cat.name_he}
                </button>
              ))}
            </div>
          </div>

          {/* Month filter */}
          <div>
            <label className="text-xs font-bold text-on-surface-variant mb-1 block">חודש</label>
            <select
              value={month || ""}
              onChange={(e) => setMonth(e.target.value || null)}
              className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">כל התקופה</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs font-bold text-on-surface-variant mb-1 block">מיון</label>
            <div className="flex gap-2">
              {[
                { value: "newest" as const, label: "חדש לישן" },
                { value: "oldest" as const, label: "ישן לחדש" },
                { value: "amount_desc" as const, label: "סכום ↓" },
                { value: "amount_asc" as const, label: "סכום ↑" },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSort(s.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    sort === s.value ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
