"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewParentPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ authCode: string; name: string } | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/parents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        phone: formData.get("phone"),
        email: formData.get("email") || undefined,
        memo: formData.get("memo") || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
    } else {
      setResult({ authCode: data.authCode, name: data.name });
    }
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">학부모 등록 완료!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">{result.name}님의 인증코드</p>
              <p className="text-4xl font-mono font-bold tracking-widest text-blue-700">
                {result.authCode}
              </p>
              <p className="text-xs text-gray-500 mt-2">유효기간: 30일</p>
            </div>
            <p className="text-sm text-gray-600 text-center">
              이 인증코드를 학부모에게 전달해주세요.<br />
              학부모가 이 코드로 앱에 가입할 수 있습니다.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setResult(null); }}>
                추가 등록
              </Button>
              <Button className="flex-1" onClick={() => router.push("/admin/parents")}>
                목록으로
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">학부모 등록</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input id="name" name="name" required placeholder="학부모 이름" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">전화번호 *</Label>
              <Input id="phone" name="phone" type="tel" required placeholder="01012345678" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일 (선택)</Label>
              <Input id="email" name="email" type="email" placeholder="parent@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memo">메모 (선택)</Label>
              <Textarea id="memo" name="memo" placeholder="참고 사항을 입력하세요" rows={3} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
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
