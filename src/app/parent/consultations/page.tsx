"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface ConsultationHistory {
  id: string;
  desiredDate: string | null;
  content: string;
  status: string;
  scheduledAt: string | null;
  summary: string | null;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  REQUESTED: "요청",
  SCHEDULED: "예정",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

export default function ParentConsultationsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<ConsultationHistory[]>([]);
  const [tab, setTab] = useState<"new" | "history">("new");

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    const res = await fetch("/api/parent/consultations/history");
    const data = await res.json();
    if (Array.isArray(data)) setHistory(data);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/parent/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        desiredDate: formData.get("desiredDate"),
        content: formData.get("content"),
      }),
    });

    const data = await res.json();
    setLoading(false);
    if (!res.ok) setError(data.error);
    else {
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
      loadHistory();
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">상담</h2>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button onClick={() => setTab("new")} className={`flex-1 py-2 rounded-md text-sm font-medium ${tab === "new" ? "bg-white shadow-sm" : "text-gray-500"}`}>새 요청</button>
        <button onClick={() => setTab("history")} className={`flex-1 py-2 rounded-md text-sm font-medium ${tab === "history" ? "bg-white shadow-sm" : "text-gray-500"}`}>이력 ({history.length})</button>
      </div>

      {tab === "new" && (
        <Card>
          <CardHeader><CardTitle className="text-lg">새 상담 요청</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="desiredDate">희망 날짜/시간</Label>
                <Input id="desiredDate" name="desiredDate" type="datetime-local" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">상담 내용 *</Label>
                <Textarea id="content" name="content" required placeholder="상담하고 싶은 내용을 작성해주세요" rows={4} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-600">상담 요청이 접수되었습니다.</p>}
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>{loading ? "요청 중..." : "상담 요청하기"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-gray-400">상담 이력이 없습니다.</CardContent></Card>
          ) : (
            history.map(c => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString("ko-KR")}</span>
                    <Badge variant={c.status === "COMPLETED" ? "success" : c.status === "SCHEDULED" ? "default" : c.status === "CANCELLED" ? "secondary" : "warning"}>
                      {statusLabels[c.status] || c.status}
                    </Badge>
                  </div>
                  <p className="text-sm">{c.content}</p>
                  {c.scheduledAt && <p className="text-xs text-blue-600 mt-2">예정: {new Date(c.scheduledAt).toLocaleString("ko-KR")}</p>}
                  {c.summary && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                      <span className="font-medium">상담 요약:</span> {c.summary}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
