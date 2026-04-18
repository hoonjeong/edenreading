"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface Consultation {
  id: string;
  parent: { name: string };
  student: { name: string };
  desiredDate: string | null;
  content: string;
  status: "REQUESTED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  adminMemo: string | null;
  scheduledAt: string | null;
  summary: string | null;
  createdAt: string;
}

const statusMap = {
  REQUESTED: { label: "요청", color: "warning" as const },
  SCHEDULED: { label: "예정", color: "default" as const },
  COMPLETED: { label: "완료", color: "success" as const },
  CANCELLED: { label: "취소", color: "secondary" as const },
};

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ status: "", scheduledAt: "", summary: "", adminMemo: "" });

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/admin/consultations");
    const data = await res.json();
    if (Array.isArray(data)) setConsultations(data);
  }

  async function save(id: string) {
    await fetch(`/api/admin/consultations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    load();
  }

  const requested = consultations.filter(c => c.status === "REQUESTED");
  const others = consultations.filter(c => c.status !== "REQUESTED");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">상담 관리</h1>

      {requested.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg text-orange-600">새 상담 요청 ({requested.length}건)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {requested.map(c => (
              <div key={c.id} className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium">{c.parent.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({c.student.name} 학부모)</span>
                  </div>
                  <Badge variant="warning">요청</Badge>
                </div>
                <p className="text-sm text-gray-700">{c.content}</p>
                {c.desiredDate && <p className="text-xs text-gray-500 mt-2">희망 일시: {new Date(c.desiredDate).toLocaleString("ko-KR")}</p>}
                <p className="text-xs text-gray-400 mt-1">요청일: {new Date(c.createdAt).toLocaleString("ko-KR")}</p>

                {editingId === c.id ? (
                  <div className="mt-3 space-y-2 p-3 bg-white rounded-lg">
                    <div className="flex gap-2">
                      <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                        className="text-sm border rounded px-2 py-1">
                        <option value="SCHEDULED">일정 확정</option>
                        <option value="COMPLETED">완료</option>
                        <option value="CANCELLED">취소</option>
                      </select>
                      {editForm.status === "SCHEDULED" && (
                        <Input type="datetime-local" className="h-8 text-sm" value={editForm.scheduledAt}
                          onChange={e => setEditForm({ ...editForm, scheduledAt: e.target.value })} />
                      )}
                    </div>
                    <Textarea className="text-sm" rows={2} placeholder="상담 메모 (내부용)"
                      value={editForm.adminMemo} onChange={e => setEditForm({ ...editForm, adminMemo: e.target.value })} />
                    {editForm.status === "COMPLETED" && (
                      <Textarea className="text-sm" rows={2} placeholder="상담 요약"
                        value={editForm.summary} onChange={e => setEditForm({ ...editForm, summary: e.target.value })} />
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => save(c.id)}>저장</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => {
                    setEditingId(c.id);
                    setEditForm({ status: "SCHEDULED", scheduledAt: "", summary: "", adminMemo: c.adminMemo || "" });
                  }}>처리하기</Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">상담 이력</CardTitle></CardHeader>
        <CardContent>
          {others.length === 0 && requested.length === 0 ? (
            <p className="text-gray-400 text-center py-8">상담 내역이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {others.map(c => {
                const s = statusMap[c.status];
                return (
                  <div key={c.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{c.parent.name}</span>
                        <span className="text-xs text-gray-500 ml-2">({c.student.name})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={s.color}>{s.label}</Badge>
                        {editingId !== c.id && (
                          <button className="text-xs text-blue-600 hover:underline" onClick={() => {
                            setEditingId(c.id);
                            setEditForm({ status: c.status, scheduledAt: c.scheduledAt || "", summary: c.summary || "", adminMemo: c.adminMemo || "" });
                          }}>수정</button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{c.content}</p>
                    {c.scheduledAt && <p className="text-xs text-blue-600 mt-1">예정: {new Date(c.scheduledAt).toLocaleString("ko-KR")}</p>}
                    {c.summary && <p className="text-xs text-gray-600 mt-1 bg-white p-2 rounded">요약: {c.summary}</p>}
                    {c.adminMemo && <p className="text-xs text-gray-400 mt-1 italic">내부 메모: {c.adminMemo}</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(c.createdAt).toLocaleDateString("ko-KR")}</p>

                    {editingId === c.id && (
                      <div className="mt-2 space-y-2 p-3 bg-white rounded-lg">
                        <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="text-sm border rounded px-2 py-1">
                          <option value="SCHEDULED">일정 확정</option>
                          <option value="COMPLETED">완료</option>
                          <option value="CANCELLED">취소</option>
                        </select>
                        <Textarea className="text-sm" rows={2} placeholder="상담 메모" value={editForm.adminMemo} onChange={e => setEditForm({ ...editForm, adminMemo: e.target.value })} />
                        <Textarea className="text-sm" rows={2} placeholder="상담 요약" value={editForm.summary} onChange={e => setEditForm({ ...editForm, summary: e.target.value })} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => save(c.id)}>저장</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
