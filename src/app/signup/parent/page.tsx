"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Step = "code" | "confirm" | "password";

export default function ParentSignupPage() {
  const [step, setStep] = useState<Step>("code");
  const [authCode, setAuthCode] = useState("");
  const [parentInfo, setParentInfo] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function verifyCode() {
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/signup/parent/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authCode: authCode.toUpperCase() }),
    });
    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(result.error);
    } else {
      setParentInfo(result.parent);
      setStep("confirm");
    }
  }

  async function setPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const passwordConfirm = formData.get("passwordConfirm") as string;

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/signup/parent/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authCode: authCode.toUpperCase(), password }),
    });

    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">가입 완료!</CardTitle>
            <CardDescription>학부모 계정이 생성되었습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => router.push("/login")}>
              로그인하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>학부모 가입</CardTitle>
          <CardDescription>
            {step === "code" && "교육원에서 받으신 인증코드를 입력해주세요"}
            {step === "confirm" && "정보를 확인해주세요"}
            {step === "password" && "비밀번호를 설정해주세요"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "code" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="authCode">인증코드 (6자리)</Label>
                <Input
                  id="authCode"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="ABC123"
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={verifyCode}
                disabled={authCode.length !== 6 || loading}
              >
                {loading ? "확인 중..." : "인증코드 확인"}
              </Button>
              <button
                type="button"
                className="w-full text-sm text-gray-500 hover:underline"
                onClick={() => router.push("/login")}
              >
                로그인으로 돌아가기
              </button>
            </div>
          )}

          {step === "confirm" && parentInfo && (
            <div className="space-y-4">
              <div className="rounded-lg bg-orange-50 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">이름</span>
                  <span className="font-medium">{parentInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">전화번호</span>
                  <span className="font-medium">{parentInfo.phone}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">위 정보가 맞으시면 다음으로 진행해주세요.</p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={() => setStep("password")}
              >
                정보 확인 완료
              </Button>
              <button
                type="button"
                className="w-full text-sm text-gray-500 hover:underline"
                onClick={() => { setStep("code"); setError(""); }}
              >
                뒤로가기
              </button>
            </div>
          )}

          {step === "password" && (
            <form onSubmit={setPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input id="password" name="password" type="password" required minLength={6} placeholder="6자 이상" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
                <Input id="passwordConfirm" name="passwordConfirm" type="password" required placeholder="비밀번호 재입력" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
                {loading ? "가입 중..." : "가입 완료"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
