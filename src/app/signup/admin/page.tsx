"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminSignupPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      password: formData.get("password"),
      role: formData.get("role"),
    };

    if (data.password !== formData.get("passwordConfirm")) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/signup/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(result.error || "회원가입에 실패했습니다.");
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">가입 완료!</CardTitle>
            <CardDescription>
              관리자 계정이 생성되었습니다. 로그인해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push("/login")}>
              로그인하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>관리자 회원가입</CardTitle>
          <CardDescription>이든국어독서교육원 관리자 계정을 생성합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" name="name" required placeholder="홍길동" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" name="email" type="email" required placeholder="admin@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <Input id="phone" name="phone" type="tel" required placeholder="01012345678" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">권한</Label>
              <select
                id="role"
                name="role"
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="DIRECTOR"
              >
                <option value="DIRECTOR">원장</option>
                <option value="TEACHER">교사</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input id="password" name="password" type="password" required minLength={6} placeholder="6자 이상" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
              <Input id="passwordConfirm" name="passwordConfirm" type="password" required placeholder="비밀번호 재입력" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "가입 중..." : "가입하기"}
            </Button>
            <button
              type="button"
              className="w-full text-sm text-gray-500 hover:underline"
              onClick={() => router.push("/login")}
            >
              로그인으로 돌아가기
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
