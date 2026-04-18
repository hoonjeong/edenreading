"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface ParentOption {
  id: string;
  name: string;
  phone: string;
}

interface ClassOption {
  id: string;
  name: string;
  teacher: string | null;
  status: "ACTIVE" | "INACTIVE" | "PAUSED";
}

type Status = "ACTIVE" | "ON_LEAVE" | "WITHDRAWN";

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [allParents, setAllParents] = useState<ParentOption[]>([]);
  const [allClasses, setAllClasses] = useState<ClassOption[]>([]);
  const [selectedParents, setSelectedParents] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("ACTIVE");
  const [form, setForm] = useState({
    name: "",
    grade: "",
    school: "",
    birthDate: "",
    specialNotes: "",
    leaveReason: "",
    withdrawDate: "",
    withdrawReason: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/students/${params.id}`).then((r) => r.json()),
      fetch("/api/admin/parents").then((r) => r.json()),
      fetch("/api/admin/classes").then((r) => r.json()),
    ]).then(([student, parents, classes]) => {
      setForm({
        name: student.name || "",
        grade: student.grade || "",
        school: student.school || "",
        birthDate: student.birthDate
          ? new Date(student.birthDate).toISOString().split("T")[0]
          : "",
        specialNotes: student.specialNotes || "",
        leaveReason: student.leaveReason || "",
        withdrawDate: student.withdrawDate
          ? new Date(student.withdrawDate).toISOString().split("T")[0]
          : "",
        withdrawReason: student.withdrawReason || "",
      });
      if (student.withdrawDate) setStatus("WITHDRAWN");
      else if (student.isOnLeave) setStatus("ON_LEAVE");
      else setStatus("ACTIVE");

      setSelectedParents(
        student.parents?.map((p: { parentId: string }) => p.parentId) || []
      );
      if (Array.isArray(parents))
        setAllParents(
          parents.map((p: ParentOption) => ({ id: p.id, name: p.name, phone: p.phone }))
        );
      if (Array.isArray(classes))
        setAllClasses(
          classes.map((c: ClassOption) => ({
            id: c.id,
            name: c.name,
            teacher: c.teacher,
            status: c.status,
          }))
        );

      if (Array.isArray(student.classStudents)) {
        setSelectedClasses(
          student.classStudents.map((cs: { classId: string }) => cs.classId)
        );
      }
    });
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch(`/api/admin/students/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        birthDate: form.birthDate || undefined,
        isActive: status === "ACTIVE",
        isOnLeave: status === "ON_LEAVE",
        leaveReason: status === "ON_LEAVE" ? form.leaveReason : null,
        withdrawDate: status === "WITHDRAWN" ? form.withdrawDate : null,
        withdrawReason: status === "WITHDRAWN" ? form.withdrawReason : null,
        parentIds: selectedParents,
        classIds: selectedClasses,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) setError(data.error);
    else router.push(`/admin/students/${params.id}`);
  }

  async function handleDelete() {
    if (!confirm("정말 이 학생을 삭제하시겠습니까? 관련된 모든 기록이 삭제됩니다.")) return;
    const res = await fetch(`/api/admin/students/${params.id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/students");
    else {
      const data = await res.json();
      setError(data.error);
    }
  }

  const activeOrCurrent = (c: ClassOption) =>
    c.status === "ACTIVE" || selectedClasses.includes(c.id);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">학생 정보 수정</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="school">학교</Label>
                <Input
                  id="school"
                  value={form.school}
                  onChange={(e) => setForm({ ...form, school: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">학년</Label>
                <Input
                  id="grade"
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">생년월일</Label>
              <Input
                id="birthDate"
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialNotes">특이사항</Label>
              <Textarea
                id="specialNotes"
                value={form.specialNotes}
                onChange={(e) => setForm({ ...form, specialNotes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label>재원 상태</Label>
              <div className="flex gap-3 flex-wrap">
                {(
                  [
                    ["ACTIVE", "재원중"],
                    ["ON_LEAVE", "휴원"],
                    ["WITHDRAWN", "퇴원"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={status === key}
                      onChange={() => setStatus(key)}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
              {status === "ON_LEAVE" && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="leaveReason">휴원 사유</Label>
                  <Input
                    id="leaveReason"
                    value={form.leaveReason}
                    onChange={(e) => setForm({ ...form, leaveReason: e.target.value })}
                    placeholder="휴원 사유"
                  />
                </div>
              )}
              {status === "WITHDRAWN" && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="withdrawDate">퇴원일</Label>
                  <Input
                    id="withdrawDate"
                    type="date"
                    value={form.withdrawDate}
                    onChange={(e) => setForm({ ...form, withdrawDate: e.target.value })}
                  />
                  <Label htmlFor="withdrawReason">퇴원 사유</Label>
                  <Input
                    id="withdrawReason"
                    value={form.withdrawReason}
                    onChange={(e) =>
                      setForm({ ...form, withdrawReason: e.target.value })
                    }
                    placeholder="퇴원 사유"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>수강반 ({selectedClasses.length}개)</Label>
              {allClasses.length === 0 ? (
                <p className="text-sm text-gray-400">등록된 수강반이 없습니다.</p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {allClasses.filter(activeOrCurrent).map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 cursor-pointer text-sm hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClasses.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setSelectedClasses([...selectedClasses, c.id]);
                          else
                            setSelectedClasses(
                              selectedClasses.filter((id) => id !== c.id)
                            );
                        }}
                      />
                      <span className="flex-1 truncate">{c.name}</span>
                      {c.status !== "ACTIVE" && (
                        <span className="text-xs text-gray-400">
                          ({c.status === "PAUSED" ? "일시중단" : "종료"})
                        </span>
                      )}
                      {c.teacher && (
                        <span className="text-xs text-gray-400">{c.teacher}</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>학부모 연결</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                {allParents.map((parent) => (
                  <label key={parent.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedParents.includes(parent.id)}
                      onChange={(e) => {
                        if (e.target.checked)
                          setSelectedParents([...selectedParents, parent.id]);
                        else
                          setSelectedParents(
                            selectedParents.filter((id) => id !== parent.id)
                          );
                      }}
                    />
                    <span className="text-sm">
                      {parent.name} ({parent.phone})
                    </span>
                  </label>
                ))}
              </div>
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
                {loading ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Button variant="destructive" className="w-full" onClick={handleDelete}>
        학생 삭제
      </Button>
    </div>
  );
}
