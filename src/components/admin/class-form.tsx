"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export interface ClassFormValues {
  name: string;
  category: string;
  fee: string;
  feePerSession: string;
  targetGrade: string;
  teacher: string;
  assistantTeacher: string;
  classroom: string;
  capacity: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "INACTIVE" | "PAUSED";
}

const empty: ClassFormValues = {
  name: "",
  category: "",
  fee: "0",
  feePerSession: "",
  targetGrade: "",
  teacher: "",
  assistantTeacher: "",
  classroom: "",
  capacity: "",
  startDate: "",
  endDate: "",
  status: "ACTIVE",
};

export function ClassForm({
  initial,
  classId,
}: {
  initial?: Partial<ClassFormValues>;
  classId?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ClassFormValues>({ ...empty, ...initial });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof ClassFormValues>(key: K, value: ClassFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = classId ? `/api/admin/classes/${classId}` : "/api/admin/classes";
    const method = classId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "오류가 발생했습니다.");
      return;
    }
    router.push("/admin/classes");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">수업명 *</Label>
            <Input
              id="name"
              required
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="예: 독서교육원_이든(큰나무)_수요일(초5)_민지연T 26"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">구분</Label>
              <Input
                id="category"
                value={values.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="월별"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetGrade">대상</Label>
              <Input
                id="targetGrade"
                value={values.targetGrade}
                onChange={(e) => set("targetGrade", e.target.value)}
                placeholder="초5 등"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fee">수업료(원)</Label>
              <Input
                id="fee"
                type="number"
                value={values.fee}
                onChange={(e) => set("fee", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feePerSession">1회당 수업료(원)</Label>
              <Input
                id="feePerSession"
                type="number"
                value={values.feePerSession}
                onChange={(e) => set("feePerSession", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teacher">담임강사</Label>
              <Input
                id="teacher"
                value={values.teacher}
                onChange={(e) => set("teacher", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assistantTeacher">보조강사</Label>
              <Input
                id="assistantTeacher"
                value={values.assistantTeacher}
                onChange={(e) => set("assistantTeacher", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="classroom">강의실</Label>
              <Input
                id="classroom"
                value={values.classroom}
                onChange={(e) => set("classroom", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">정원</Label>
              <Input
                id="capacity"
                type="number"
                value={values.capacity}
                onChange={(e) => set("capacity", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">시작일</Label>
              <Input
                id="startDate"
                type="date"
                value={values.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">종료일</Label>
              <Input
                id="endDate"
                type="date"
                value={values.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">상태</Label>
            <select
              id="status"
              value={values.status}
              onChange={(e) => set("status", e.target.value as ClassFormValues["status"])}
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="ACTIVE">수강</option>
              <option value="PAUSED">일시중단</option>
              <option value="INACTIVE">종료</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "저장 중..." : classId ? "저장" : "등록하기"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
