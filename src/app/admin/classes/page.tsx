"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClassStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

interface ClassRow {
  id: string;
  name: string;
  category: string | null;
  fee: number;
  feePerSession: number | null;
  targetGrade: string | null;
  teacher: string | null;
  assistantTeacher: string | null;
  classroom: string | null;
  capacity: number | null;
  startDate: string | null;
  endDate: string | null;
  status: ClassStatus;
  createdAt: string;
  _count: { students: number };
}

const statusLabel: Record<ClassStatus, string> = {
  ACTIVE: "수강",
  INACTIVE: "종료",
  PAUSED: "일시중단",
};

const statusVariant: Record<ClassStatus, "success" | "secondary" | "warning"> = {
  ACTIVE: "success",
  INACTIVE: "secondary",
  PAUSED: "warning",
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | ClassStatus>("all");

  async function load() {
    const res = await fetch("/api/admin/classes");
    const data = await res.json();
    if (Array.isArray(data)) setClasses(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function remove(id: string, name: string) {
    if (!confirm(`정말 "${name}" 수업을 삭제하시겠습니까?\n수강생 연결도 함께 삭제됩니다.`)) return;
    const res = await fetch(`/api/admin/classes/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else {
      const data = await res.json();
      alert(data.error);
    }
  }

  const filtered = classes.filter((c) => {
    const matchSearch =
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.teacher || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">수강반 관리</h1>
          <p className="text-gray-500 mt-1">등록된 수업 {classes.length}개</p>
        </div>
        <Link href="/admin/classes/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            수업 등록
          </Button>
        </Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="수업명 또는 담임강사 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {(
            [
              ["all", "전체"],
              ["ACTIVE", "수강"],
              ["PAUSED", "일시중단"],
              ["INACTIVE", "종료"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            {classes.length === 0 ? (
              <>
                <p>등록된 수업이 없습니다.</p>
                <Link
                  href="/admin/classes/new"
                  className="text-blue-600 text-sm hover:underline mt-2 inline-block"
                >
                  첫 수업 등록하기
                </Link>
              </>
            ) : (
              <p>검색 결과가 없습니다.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">수업명</th>
                  <th className="text-left p-4 font-medium text-gray-600">담임강사</th>
                  <th className="text-left p-4 font-medium text-gray-600">대상</th>
                  <th className="text-left p-4 font-medium text-gray-600">정원/수강</th>
                  <th className="text-left p-4 font-medium text-gray-600">수업료</th>
                  <th className="text-left p-4 font-medium text-gray-600">상태</th>
                  <th className="text-left p-4 font-medium text-gray-600">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium">
                      <Link
                        href={`/admin/classes/${c.id}/edit`}
                        className="hover:text-blue-600"
                      >
                        {c.name}
                      </Link>
                      {c.category && (
                        <span className="ml-2 text-xs text-gray-400">{c.category}</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">
                      {c.teacher || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="p-4 text-gray-600">
                      {c.targetGrade || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="p-4 text-gray-600">
                      <span className="font-medium">{c._count.students}</span>
                      {c.capacity ? (
                        <span className="text-gray-400"> / {c.capacity}</span>
                      ) : null}
                    </td>
                    <td className="p-4 text-gray-600">
                      {c.fee.toLocaleString("ko-KR")}원
                    </td>
                    <td className="p-4">
                      <Badge variant={statusVariant[c.status]}>{statusLabel[c.status]}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Link
                          href={`/admin/classes/${c.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                          title="수정"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => remove(c.id, c.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
