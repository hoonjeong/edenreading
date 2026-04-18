"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function NewExamPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        grade: formData.get("grade") || undefined,
        quarter: formData.get("quarter") ? Number(formData.get("quarter")) : undefined,
        examDate: formData.get("examDate") || undefined,
        duration: formData.get("duration") ? Number(formData.get("duration")) : undefined,
        objectiveCount: Number(formData.get("objectiveCount")) || 0,
        essayCount: Number(formData.get("essayCount")) || 0,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
    } else {
      router.push(`/admin/exams/${data.id}`);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">새 시험 만들기</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">시험명 *</Label>
              <Input id="name" name="name" required placeholder="예: 2026 2분기 읽기 진단" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">학년</Label>
                <Input id="grade" name="grade" placeholder="예: 초등 1-2" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quarter">분기</Label>
                <select
                  id="quarter"
                  name="quarter"
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택</option>
                  <option value="1">1분기</option>
                  <option value="2">2분기</option>
                  <option value="3">3분기</option>
                  <option value="4">4분기</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="examDate">시험 날짜</Label>
                <Input id="examDate" name="examDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">시험 시간 (분)</Label>
                <Input id="duration" name="duration" type="number" placeholder="60" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="objectiveCount">객관식 문항 수</Label>
                <Input id="objectiveCount" name="objectiveCount" type="number" defaultValue={30} min={0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="essayCount">서술형 문항 수</Label>
                <Input id="essayCount" name="essayCount" type="number" defaultValue={0} min={0} />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
                취소
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "생성 중..." : "시험 생성"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
