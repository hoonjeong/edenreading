"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: "DIRECTOR" | "TEACHER";
}

interface Student {
  id: string;
  name: string;
  grade: string | null;
  school: string | null;
}

export default function MemberStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const adminId = params.id as string;

  const [admin, setAdmin] = useState<Admin | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/members`).then((r) => r.json()),
      fetch(`/api/admin/members/${adminId}/students`).then((r) => r.json()),
      fetch(`/api/admin/students`).then((r) => r.json()),
    ]).then(([admins, assigned, students]) => {
      const target = Array.isArray(admins)
        ? admins.find((a: Admin) => a.id === adminId)
        : null;
      setAdmin(target || null);
      if (Array.isArray(assigned))
        setSelected(new Set(assigned.map((s: Student) => s.id)));
      if (Array.isArray(students)) setAllStudents(students);
    });
  }, [adminId]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/admin/members/${adminId}/students`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentIds: Array.from(selected) }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage(`담당 학생 ${selected.size}명이 저장되었습니다.`);
    } else {
      const data = await res.json();
      setMessage(`오류: ${data.error}`);
    }
  }

  const filtered = allStudents.filter(
    (s) =>
      search === "" ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.school || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!admin) return <div className="p-8 text-center text-gray-400">로딩 중...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{admin.name}님의 담당 학생</h1>
          <p className="text-gray-500 text-sm mt-1">
            {admin.email} · {admin.role === "DIRECTOR" ? "원장" : "교사"}
          </p>
        </div>
        <Link
          href="/admin/members"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
        >
          관리자 목록
        </Link>
      </div>

      {admin.role === "DIRECTOR" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          원장은 모든 학생에 자동 접근 가능합니다. 담당 지정은 선택 사항입니다.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            담당 학생 선택 ({selected.size}명 선택됨)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="이름·학교 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelected(new Set(filtered.map((s) => s.id)))}
            >
              표시된 {filtered.length}명 모두 선택
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>
              선택 해제
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto border rounded-lg divide-y">
            {filtered.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">학생이 없습니다.</p>
            ) : (
              filtered.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={() => toggle(s.id)}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-gray-500">
                      {s.school || ""} {s.grade && `· ${s.grade}`}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>
          {message && (
            <p
              className={`text-sm ${
                message.startsWith("오류") ? "text-red-600" : "text-green-700"
              }`}
            >
              {message}
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => router.back()} className="flex-1">
              취소
            </Button>
            <Button onClick={save} disabled={saving} className="flex-1">
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
