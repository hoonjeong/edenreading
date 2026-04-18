"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function NewStudentPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [parents, setParents] = useState<ParentOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedParents, setSelectedParents] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/parents")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setParents(
            data.map((p: ParentOption & Record<string, unknown>) => ({
              id: p.id,
              name: p.name,
              phone: p.phone,
            }))
          );
        }
      });
    fetch("/api/admin/classes")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setClasses(
            data.map((c: ClassOption) => ({
              id: c.id,
              name: c.name,
              teacher: c.teacher,
              status: c.status,
            }))
          );
        }
      });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        grade: formData.get("grade") || undefined,
        school: formData.get("school") || undefined,
        birthDate: formData.get("birthDate") || undefined,
        specialNotes: formData.get("specialNotes") || undefined,
        parentIds: selectedParents,
        classIds: selectedClasses,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
    } else {
      router.push("/admin/students");
    }
  }

  const activeClasses = classes.filter((c) => c.status === "ACTIVE");

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">학생 등록</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input id="name" name="name" required placeholder="학생 이름" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="school">학교</Label>
                <Input id="school" name="school" placeholder="예: 상일초" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">학년</Label>
                <Input id="grade" name="grade" placeholder="예: 초3" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">생년월일</Label>
              <Input id="birthDate" name="birthDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialNotes">특이사항</Label>
              <Textarea
                id="specialNotes"
                name="specialNotes"
                placeholder="참고할 사항을 입력하세요"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>수강반 ({selectedClasses.length}개 선택)</Label>
              {activeClasses.length === 0 ? (
                <p className="text-sm text-gray-400">등록된 수강반이 없습니다.</p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {activeClasses.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 cursor-pointer text-sm hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedClasses.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedClasses([...selectedClasses, c.id]);
                          else
                            setSelectedClasses(selectedClasses.filter((id) => id !== c.id));
                        }}
                      />
                      <span className="flex-1 truncate">{c.name}</span>
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
              {parents.length === 0 ? (
                <p className="text-sm text-gray-400">등록된 학부모가 없습니다.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {parents.map((parent) => (
                    <label key={parent.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
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
              )}
              {selectedParents.length === 0 && (
                <p className="text-xs text-amber-600">
                  학부모를 연결하지 않으면 활동 공유가 불가합니다.
                </p>
              )}
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
                {loading ? "등록 중..." : "등록하기"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
