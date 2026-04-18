"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "DIRECTOR" | "TEACHER";
  isApproved: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function MembersPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentRole, setCurrentRole] = useState<string>("");

  useEffect(() => {
    loadAdmins();
    fetch("/api/auth/session").then(r => r.json()).then(data => {
      if (data?.user) {
        setCurrentUserId(data.user.id);
        setCurrentRole(data.user.role || "");
      }
    });
  }, []);

  async function loadAdmins() {
    const res = await fetch("/api/admin/members");
    const data = await res.json();
    if (Array.isArray(data)) setAdmins(data);
  }

  async function approve(id: string) {
    await fetch(`/api/admin/members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: true }),
    });
    loadAdmins();
  }

  async function changeRole(id: string, role: string) {
    const res = await fetch(`/api/admin/members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) loadAdmins();
    else {
      const data = await res.json();
      alert(data.error);
    }
  }

  async function deleteAdmin(id: string, name: string) {
    if (!confirm(`정말 ${name}을(를) 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
    if (res.ok) loadAdmins();
    else {
      const data = await res.json();
      alert(data.error);
    }
  }

  const isDirector = currentRole === "DIRECTOR";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">관리자 관리</h1>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium text-gray-600">이름</th>
                <th className="text-left p-4 font-medium text-gray-600">이메일</th>
                <th className="text-left p-4 font-medium text-gray-600">전화번호</th>
                <th className="text-left p-4 font-medium text-gray-600">권한</th>
                <th className="text-left p-4 font-medium text-gray-600">상태</th>
                <th className="text-left p-4 font-medium text-gray-600">최근 접속</th>
                {isDirector && <th className="text-left p-4 font-medium text-gray-600">작업</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">
                    {admin.name}
                    {admin.id === currentUserId && <span className="text-xs text-blue-500 ml-1">(나)</span>}
                  </td>
                  <td className="p-4 text-gray-600">{admin.email}</td>
                  <td className="p-4 text-gray-600">{admin.phone}</td>
                  <td className="p-4">
                    {isDirector && admin.id !== currentUserId ? (
                      <select
                        value={admin.role}
                        onChange={(e) => changeRole(admin.id, e.target.value)}
                        className="text-xs border rounded px-2 py-1"
                      >
                        <option value="DIRECTOR">원장</option>
                        <option value="TEACHER">교사</option>
                      </select>
                    ) : (
                      <Badge variant={admin.role === "DIRECTOR" ? "default" : "secondary"}>
                        {admin.role === "DIRECTOR" ? "원장" : "교사"}
                      </Badge>
                    )}
                  </td>
                  <td className="p-4">
                    {admin.isApproved ? <Badge variant="success">승인됨</Badge> : <Badge variant="warning">대기중</Badge>}
                  </td>
                  <td className="p-4 text-gray-500 text-xs">
                    {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleDateString("ko-KR") : "-"}
                  </td>
                  {isDirector && (
                    <td className="p-4">
                      <div className="flex gap-1">
                        {!admin.isApproved && (
                          <Button size="sm" variant="outline" onClick={() => approve(admin.id)}>승인</Button>
                        )}
                        <Link href={`/admin/members/${admin.id}`}>
                          <Button size="sm" variant="ghost">담당</Button>
                        </Link>
                        {admin.id !== currentUserId && (
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => deleteAdmin(admin.id, admin.name)}>삭제</Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
