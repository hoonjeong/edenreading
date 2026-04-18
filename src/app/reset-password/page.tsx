"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ResetPasswordPage() {
  const [type, setType] = useState<"admin" | "parent">("admin");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        email: formData.get("email"),
        phone: formData.get("phone"),
        newPassword,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) setError(data.error);
    else setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">비밀번호 초기화 완료</CardTitle>
            <CardDescription>새 비밀번호로 로그인해주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push("/login")}>로그인하기</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>비밀번호 찾기</CardTitle>
          <CardDescription>본인 확인 후 비밀번호를 초기화합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setType("admin")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${type === "admin" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >관리자</button>
            <button
              onClick={() => setType("parent")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${type === "parent" ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >학부모</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {type === "admin" && (
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input id="email" name="email" type="email" required placeholder="가입 시 등록한 이메일" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <Input id="phone" name="phone" type="tel" required placeholder="가입 시 등록한 전화번호" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">새 비밀번호</Label>
              <Input id="newPassword" name="newPassword" type="password" required minLength={6} placeholder="6자 이상" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required placeholder="비밀번호 재입력" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "확인 중..." : "비밀번호 초기화"}</Button>
            <button type="button" className="w-full text-sm text-gray-500 hover:underline" onClick={() => router.push("/login")}>로그인으로 돌아가기</button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
