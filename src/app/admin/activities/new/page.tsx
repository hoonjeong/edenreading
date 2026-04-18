"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, Video } from "lucide-react";

interface StudentOption {
  id: string;
  name: string;
  grade: string | null;
}

interface MediaFile {
  url: string;
  fileName: string;
  fileSize: number;
  type: "PHOTO" | "VIDEO";
  preview?: string;
}

export default function NewActivityPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [notifySms, setNotifySms] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch("/api/admin/students")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStudents(data.map((s: StudentOption) => ({ id: s.id, name: s.name, grade: s.grade })));
        }
      });
    const sid = searchParams.get("studentId");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (sid) setSelectedStudent(sid);
  }, [searchParams]);

  async function handleFileUpload(files: FileList) {
    setUploading(true);
    setError("");

    const photoCount = media.filter((m) => m.type === "PHOTO").length;
    const videoCount = media.filter((m) => m.type === "VIDEO").length;

    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith("video/");

      if (isVideo && videoCount >= 3) {
        setError("동영상은 최대 3개까지 업로드 가능합니다.");
        continue;
      }
      if (!isVideo && photoCount >= 20) {
        setError("사진은 최대 20개까지 업로드 가능합니다.");
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok) {
          setMedia((prev) => [...prev, { ...data, preview: isVideo ? undefined : data.url }]);
        } else {
          setError(data.error);
        }
      } catch {
        setError("파일 업로드에 실패했습니다.");
      }
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, isDraft: boolean, isShared: boolean) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/admin/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: selectedStudent,
        title: formData.get("title"),
        content: formData.get("content"),
        activityDate: formData.get("activityDate"),
        isDraft,
        isShared,
        media,
        notifySms: isShared && notifySms,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
    } else {
      router.push("/admin/activities");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">활동 기록</h1>
      <Card>
        <CardContent className="pt-6">
          <form
            onSubmit={(e) => {
              const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
              const action = submitter?.value || "draft";
              handleSubmit(e, action === "draft", action === "share");
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>학생 선택 *</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                required
              >
                <option value="">학생을 선택하세요</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.grade ? `(${s.grade})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityDate">날짜 *</Label>
              <Input
                id="activityDate"
                name="activityDate"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input id="title" name="title" required placeholder="활동 제목을 입력하세요" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <Textarea id="content" name="content" placeholder="활동 내용을 작성하세요" rows={5} />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>사진/동영상</Label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-blue-400"); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove("border-blue-400"); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("border-blue-400");
                  if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files);
                }}
              >
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  {uploading ? "업로드 중..." : "클릭하거나 파일을 드래그하세요"}
                </p>
                <p className="text-xs text-gray-400 mt-1">사진 최대 10MB, 동영상 최대 100MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept="image/*,video/*"
                onChange={(e) => {
                  if (e.target.files?.length) handleFileUpload(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Media Preview */}
            {media.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {media.map((m, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                    {m.type === "PHOTO" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-8 w-8 text-gray-400" />
                        <span className="text-xs text-gray-500 absolute bottom-1">{m.fileName}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setMedia(media.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={notifySms}
                onChange={(e) => setNotifySms(e.target.checked)}
                className="rounded"
              />
              <span>공유와 함께 SMS도 발송 (수신 동의 학부모만)</span>
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
                취소
              </Button>
              <Button type="submit" name="action" value="draft" variant="secondary" className="flex-1" disabled={loading}>
                임시저장
              </Button>
              <Button type="submit" name="action" value="share" className="flex-1" disabled={loading}>
                {loading ? "저장 중..." : "공유하기"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
