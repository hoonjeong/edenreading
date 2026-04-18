"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Save } from "lucide-react";

interface ParentInfo {
  name: string;
  phone: string;
  email: string | null;
  notifyKakao: boolean;
  notifySms: boolean;
  notifyPush: boolean;
  children: { student: { name: string; grade: string | null } }[];
}

export default function MyPage() {
  const [info, setInfo] = useState<ParentInfo | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ phone: "", email: "" });
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [noti, setNoti] = useState({ kakao: true, sms: true, push: true });
  const [message, setMessage] = useState("");
  const [pwMessage, setPwMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/parent/mypage").then(r => r.json()).then(data => {
      if (data && !data.error) {
        setInfo(data);
        setEditForm({ phone: data.phone, email: data.email || "" });
        setNoti({ kakao: data.notifyKakao, sms: data.notifySms, push: data.notifyPush });
      }
    });
  }, []);

  async function saveInfo() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/parent/mypage", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: editForm.phone, email: editForm.email || null }),
    });
    setLoading(false);
    if (res.ok) {
      setMessage("정보가 수정되었습니다.");
      setEditMode(false);
    } else {
      const data = await res.json();
      setMessage(data.error);
    }
  }

  async function changePassword() {
    setPwMessage("");
    if (pwForm.newPw !== pwForm.confirm) {
      setPwMessage("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwMessage("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/parent/mypage/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
    });
    setLoading(false);
    const data = await res.json();
    if (res.ok) {
      setPwMessage("비밀번호가 변경되었습니다.");
      setPwForm({ current: "", newPw: "", confirm: "" });
    } else {
      setPwMessage(data.error);
    }
  }

  async function saveNotification() {
    setLoading(true);
    await fetch("/api/parent/mypage/notification", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noti),
    });
    setLoading(false);
    setMessage("알림 설정이 저장되었습니다.");
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">내 정보</h2>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {info && !editMode && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">이름</span><span>{info.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">전화번호</span><span>{info.phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">이메일</span><span>{info.email || "-"}</span></div>
              <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setEditMode(true)}>정보 수정</Button>
            </div>
          )}
          {editMode && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>전화번호</Label>
                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>이메일</Label>
                <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="이메일" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditMode(false)}>취소</Button>
                <Button size="sm" className="flex-1" onClick={saveInfo} disabled={loading}><Save className="h-3 w-3 mr-1" />저장</Button>
              </div>
            </div>
          )}
          {message && <p className="text-sm text-green-600">{message}</p>}
        </CardContent>
      </Card>

      {/* 연결된 자녀 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">연결된 자녀</CardTitle>
        </CardHeader>
        <CardContent>
          {info?.children.length === 0 ? (
            <p className="text-sm text-gray-400">연결된 자녀가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {info?.children.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                    {c.student.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{c.student.name}</p>
                    <p className="text-xs text-gray-500">{c.student.grade || ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3">자녀 추가는 교육원에 문의해주세요.</p>
        </CardContent>
      </Card>

      {/* 비밀번호 변경 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">비밀번호 변경</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>현재 비밀번호</Label>
            <Input type="password" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>새 비밀번호 (6자 이상)</Label>
            <Input type="password" value={pwForm.newPw} onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>새 비밀번호 확인</Label>
            <Input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
          </div>
          {pwMessage && <p className={`text-sm ${pwMessage.includes("변경") ? "text-green-600" : "text-red-600"}`}>{pwMessage}</p>}
          <Button size="sm" className="w-full" onClick={changePassword} disabled={loading || !pwForm.current || !pwForm.newPw}>변경하기</Button>
        </CardContent>
      </Card>

      {/* 알림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">알림 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "kakao" as const, label: "카카오톡 알림" },
            { key: "sms" as const, label: "SMS 알림" },
            { key: "push" as const, label: "푸시 알림" },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">{item.label}</span>
              <button
                onClick={() => setNoti({ ...noti, [item.key]: !noti[item.key] })}
                className={`w-11 h-6 rounded-full transition-colors relative ${noti[item.key] ? "bg-orange-500" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${noti[item.key] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </label>
          ))}
          <Button variant="outline" size="sm" className="w-full" onClick={saveNotification}>설정 저장</Button>
        </CardContent>
      </Card>

      {/* 로그아웃 */}
      <Button variant="destructive" className="w-full" onClick={() => signOut({ callbackUrl: "/login" })}>
        <LogOut className="h-4 w-4 mr-2" />로그아웃
      </Button>
    </div>
  );
}
