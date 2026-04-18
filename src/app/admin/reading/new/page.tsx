"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X } from "lucide-react";

export default function NewReadingPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [coverUrl, setCoverUrl] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [notifySms, setNotifySms] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/students").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setStudents(data);
    });
  }, []);

  async function uploadFile(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    return res.ok ? data.url : null;
  }

  async function handleCoverUpload(files: FileList) {
    const url = await uploadFile(files[0]);
    if (url) setCoverUrl(url);
  }

  async function handlePhotoUpload(files: FileList) {
    for (const file of Array.from(files)) {
      const url = await uploadFile(file);
      if (url) setPhotos(prev => [...prev, url]);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, isShared: boolean) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: formData.get("studentId"),
        bookTitle: formData.get("bookTitle"),
        bookAuthor: formData.get("bookAuthor") || undefined,
        readDate: formData.get("readDate"),
        teacherNote: formData.get("teacherNote") || undefined,
        coverPhotoUrl: coverUrl || undefined,
        photos,
        isShared,
        notifySms: isShared && notifySms,
      }),
    });

    const data = await res.json();
    setLoading(false);
    if (!res.ok) setError(data.error);
    else router.push("/admin/reading");
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">독서 기록 등록</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={(e) => {
            const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
            handleSubmit(e, submitter?.value === "share");
          }} className="space-y-4">
            <div className="space-y-2">
              <Label>학생 *</Label>
              <select name="studentId" required className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="">선택</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bookTitle">책 제목 *</Label>
              <Input id="bookTitle" name="bookTitle" required placeholder="책 제목" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bookAuthor">저자</Label>
              <Input id="bookAuthor" name="bookAuthor" placeholder="저자명" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="readDate">읽은 날짜 *</Label>
              <Input id="readDate" name="readDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
            </div>

            {/* 표지 사진 */}
            <div className="space-y-2">
              <Label>표지 사진</Label>
              {coverUrl ? (
                <div className="relative w-24 h-32 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setCoverUrl("")} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => coverInputRef.current?.click()} className="w-24 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-400">
                  <Upload className="h-5 w-5 mb-1" /><span className="text-xs">표지</span>
                </button>
              )}
              <input ref={coverInputRef} type="file" className="hidden" accept="image/*" onChange={e => { if (e.target.files) handleCoverUpload(e.target.files); e.target.value = ""; }} />
            </div>

            {/* 활동 사진 */}
            <div className="space-y-2">
              <Label>독서 활동 사진</Label>
              <div className="flex gap-2 flex-wrap">
                {photos.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-400">
                  <Upload className="h-5 w-5" />
                </button>
              </div>
              <input ref={fileInputRef} type="file" className="hidden" multiple accept="image/*" onChange={e => { if (e.target.files) handlePhotoUpload(e.target.files); e.target.value = ""; }} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacherNote">교사 소감</Label>
              <Textarea id="teacherNote" name="teacherNote" placeholder="교사 소감을 작성하세요" rows={4} />
            </div>
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
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>취소</Button>
              <Button type="submit" name="action" value="save" variant="secondary" className="flex-1" disabled={loading}>저장</Button>
              <Button type="submit" name="action" value="share" className="flex-1" disabled={loading}>공유</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
