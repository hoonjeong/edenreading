"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type LoginType = "select" | "admin" | "parent";

export default function LoginPage() {
  const [loginType, setLoginType] = useState<LoginType>("select");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (loginType === "select") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">E</span>
            </div>
            <CardTitle className="text-2xl">이든국어독서교육원</CardTitle>
            <CardDescription>학생 관리 시스템</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full h-14 text-base"
              onClick={() => setLoginType("admin")}
            >
              관리자 로그인
            </Button>
            <Button
              variant="outline"
              className="w-full h-14 text-base border-orange-300 text-orange-700 hover:bg-orange-50"
              onClick={() => setLoginType("parent")}
            >
              학부모 로그인
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loginType === "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>관리자 로그인</CardTitle>
            <CardDescription>이메일과 비밀번호를 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                setLoading(true);
                const formData = new FormData(e.currentTarget);
                const result = await signIn("admin-login", {
                  email: formData.get("email"),
                  password: formData.get("password"),
                  redirect: false,
                });
                setLoading(false);
                if (result?.error) {
                  setError(result.error === "CredentialsSignin" ? "이메일 또는 비밀번호가 올바르지 않습니다." : result.error);
                } else {
                  router.push("/admin");
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input id="email" name="email" type="email" required placeholder="admin@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input id="password" name="password" type="password" required placeholder="비밀번호" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "로그인 중..." : "로그인"}
              </Button>
              <div className="flex justify-between text-sm">
                <button type="button" className="text-blue-600 hover:underline" onClick={() => router.push("/signup/admin")}>
                  회원가입
                </button>
                <button type="button" className="text-blue-600 hover:underline" onClick={() => router.push("/reset-password")}>
                  비밀번호 찾기
                </button>
                <button type="button" className="text-gray-500 hover:underline" onClick={() => setLoginType("select")}>
                  뒤로가기
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parent login
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>학부모 로그인</CardTitle>
          <CardDescription>전화번호와 비밀번호를 입력해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setLoading(true);
              const formData = new FormData(e.currentTarget);
              const result = await signIn("parent-login", {
                phone: formData.get("phone"),
                password: formData.get("password"),
                redirect: false,
              });
              setLoading(false);
              if (result?.error) {
                setError(result.error === "CredentialsSignin" ? "전화번호 또는 비밀번호가 올바르지 않습니다." : result.error);
              } else {
                router.push("/parent");
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <Input id="phone" name="phone" type="tel" required placeholder="01012345678" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input id="password" name="password" type="password" required placeholder="비밀번호" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </Button>
            <div className="flex justify-between text-sm">
              <button type="button" className="text-orange-600 hover:underline" onClick={() => router.push("/signup/parent")}>
                인증코드로 가입
              </button>
              <button type="button" className="text-orange-600 hover:underline" onClick={() => router.push("/reset-password")}>
                비밀번호 찾기
              </button>
              <button type="button" className="text-gray-500 hover:underline" onClick={() => setLoginType("select")}>
                뒤로가기
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
