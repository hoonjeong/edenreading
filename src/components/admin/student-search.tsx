"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function StudentSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; grade: string | null }[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    const res = await fetch(`/api/admin/students/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      setResults(data);
      setOpen(true);
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="학생 이름으로 검색..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className="pl-9"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
          {results.map((s) => (
            <button
              key={s.id}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm flex items-center justify-between"
              onMouseDown={() => router.push(`/admin/students/${s.id}`)}
            >
              <span className="font-medium">{s.name}</span>
              <span className="text-gray-400 text-xs">{s.grade || ""}</span>
            </button>
          ))}
        </div>
      )}
      {open && query.length >= 1 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 p-4 text-sm text-gray-400 text-center">
          검색 결과가 없습니다
        </div>
      )}
    </div>
  );
}
