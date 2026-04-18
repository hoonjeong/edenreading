"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Video } from "lucide-react";

interface MediaFile {
  url: string;
  fileName: string;
  fileSize: number;
  type: "PHOTO" | "VIDEO";
}

export default function EditActivityPage() {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", activityDate: "", studentId: "" });
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [hasParent, setHasParent] = useState(false);
  const [notifySms, setNotifySms] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/admin/activities/${params.id}`).then(r => r.json()).then(data => {
      if (data && !data.error) {
        setForm({
          title: data.title,
          content: data.content || "",
          activityDate: data.activityDate ? new Date(data.activityDate).toISOString().split("T")[0] : "",
          studentId: data.studentId,
        });
        setMedia(data.media?.map((m: MediaFile) => ({ url: m.url, fileName: m.fileName, fileSize: m.fileSize, type: m.type })) || []);
      }
    });
  }, [params.id]);

  useEffect(() => {
    if (form.studentId) {
      fetch(`/api/admin/students/${form.studentId}`).then(r => r.json()).then(data => {
        setHasParent(data.parents?.length > 0);
      });
    }
  }, [form.studentId]);

  async function handleFileUpload(files: FileList) {
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok) setMedia(prev => [...prev, data]);
        else setError(data.error);
      } catch { setError("업로드 실패"); }
    }
    setUploading(false);
  }

  async function handleSubmit(isDraft: boolean, isShared: boolean) {
    setError("");
    setLoading(true);

    const res = await fetch(`/api/admin/activities/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, isDraft, isShared, media, notifySms: isShared && notifySms }),
    });

    const data = await res.json();
    setLoading(false);
    if (!res.ok) setError(data.error);
    else router.push("/admin/activities");
  }

  async function handleDelete() {
    if (!confirm("정말 이 활동을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/admin/activities/${params.id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/activities");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">활동 수정</h1>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>날짜</Label>
            <Input type="date" value={form.activityDate} onChange={e => setForm({ ...form, activityDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>제목</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>내용</Label>
            <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={5} />
          </div>

          <div className="space-y-2">
            <Label>사진/동영상</Label>
            <div
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-400"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-6 w-6 mx-auto text-gray-400 mb-1" />
              <p className="text-sm text-gray-500">{uploading ? "업로드 중..." : "파일 추가"}</p>
            </div>
            <input ref={fileInputRef} type="file" className="hidden" multiple accept="image/*,video/*" onChange={e => { if (e.target.files) handleFileUpload(e.target.files); e.target.value = ""; }} />
          </div>

          {media.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {media.map((m, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {m.type === "PHOTO" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Video className="h-8 w-8 text-gray-400" /></div>
                  )}
                  <button type="button" onClick={() => setMedia(media.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              disabled={!hasParent}
            />
            <span>공유와 함께 SMS도 발송 (수신 동의 학부모만)</span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => router.back()}>취소</Button>
            <Button variant="secondary" className="flex-1" onClick={() => handleSubmit(true, false)} disabled={loading}>임시저장</Button>
            <Button className="flex-1" onClick={() => handleSubmit(false, true)} disabled={loading || !hasParent}>
              {!hasParent ? "학부모 미연결" : loading ? "저장 중..." : "공유하기"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Button variant="destructive" className="w-full" onClick={handleDelete}>활동 삭제</Button>
    </div>
  );
}
