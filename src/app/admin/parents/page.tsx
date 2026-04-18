"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Plus, Search, RotateCcw, Pencil, Trash2 } from "lucide-react";

interface Parent {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  memo: string | null;
  authCode: string | null;
  isSignedUp: boolean;
  createdAt: string;
  children: { student: { id: string; name: string } }[];
}

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "signed" | "unsigned">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", memo: "" });

  useEffect(() => { loadParents(); }, []);

  async function loadParents() {
    const res = await fetch("/api/admin/parents");
    const data = await res.json();
    if (Array.isArray(data)) setParents(data);
  }

  async function resendCode(id: string) {
    const res = await fetch(`/api/admin/parents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resend-code" }),
    });
    const data = await res.json();
    if (res.ok) {
      alert(`새 인증코드: ${data.authCode}`);
      loadParents();
    } else {
      alert(data.error);
    }
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/admin/parents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      setEditingId(null);
      loadParents();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  }

  async function deleteParent(id: string, name: string) {
    if (!confirm(`정말 ${name} 학부모를 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/admin/parents/${id}`, { method: "DELETE" });
    if (res.ok) loadParents();
    else {
      const data = await res.json();
      alert(data.error);
    }
  }

  const filtered = parents.filter((p) => {
    const matchSearch = search === "" || p.name.includes(search) || p.phone.includes(search);
    const matchFilter = filter === "all" || (filter === "signed" && p.isSignedUp) || (filter === "unsigned" && !p.isSignedUp);
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">학부모 관리</h1>
          <p className="text-gray-500 mt-1">등록된 학부모 {parents.length}명</p>
        </div>
        <Link href="/admin/parents/new">
          <Button><Plus className="h-4 w-4 mr-2" />학부모 등록</Button>
        </Link>
      </div>

      {/* 검색 + 필터 */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="이름 또는 전화번호로 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {([["all", "전체"], ["signed", "가입완료"], ["unsigned", "미가입"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            {parents.length === 0 ? (
              <>
                <p>등록된 학부모가 없습니다.</p>
                <Link href="/admin/parents/new" className="text-blue-600 text-sm hover:underline mt-2 inline-block">첫 학부모 등록하기</Link>
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
                  <th className="text-left p-4 font-medium text-gray-600">이름</th>
                  <th className="text-left p-4 font-medium text-gray-600">전화번호</th>
                  <th className="text-left p-4 font-medium text-gray-600">연결 자녀</th>
                  <th className="text-left p-4 font-medium text-gray-600">가입 상태</th>
                  <th className="text-left p-4 font-medium text-gray-600">인증코드</th>
                  <th className="text-left p-4 font-medium text-gray-600">등록일</th>
                  <th className="text-left p-4 font-medium text-gray-600">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((parent) => (
                  <tr key={parent.id} className="hover:bg-gray-50">
                    {editingId === parent.id ? (
                      <>
                        <td className="p-3"><Input className="h-8 text-sm" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></td>
                        <td className="p-3"><Input className="h-8 text-sm" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></td>
                        <td className="p-4 text-gray-500" colSpan={3}>
                          <Input className="h-8 text-sm" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="이메일" />
                        </td>
                        <td className="p-3 text-gray-500" colSpan={2}>
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => saveEdit(parent.id)}>저장</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 font-medium">{parent.name}</td>
                        <td className="p-4 text-gray-600">{parent.phone}</td>
                        <td className="p-4">
                          {parent.children.length > 0
                            ? parent.children.map((c) => c.student.name).join(", ")
                            : <span className="text-gray-400">미연결</span>}
                        </td>
                        <td className="p-4">
                          {parent.isSignedUp ? <Badge variant="success">가입완료</Badge> : <Badge variant="warning">미가입</Badge>}
                        </td>
                        <td className="p-4 font-mono text-xs">
                          {parent.authCode || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="p-4 text-gray-500 text-xs">{new Date(parent.createdAt).toLocaleDateString("ko-KR")}</td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingId(parent.id);
                                setEditForm({ name: parent.name, phone: parent.phone, email: parent.email || "", memo: parent.memo || "" });
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="수정"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            {!parent.isSignedUp && (
                              <button onClick={() => resendCode(parent.id)} className="p-1.5 text-gray-400 hover:text-green-600 rounded" title="코드 재발송">
                                <RotateCcw className="h-4 w-4" />
                              </button>
                            )}
                            <button onClick={() => deleteParent(parent.id, parent.name)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="삭제">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
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
