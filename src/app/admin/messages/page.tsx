"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Send, RotateCcw, Trash2, FileText } from "lucide-react";

function getByteLength(str: string): number {
  let bytes = 0;
  for (let i = 0; i < str.length; i++) {
    bytes += str.charCodeAt(i) > 0x7f ? 2 : 1;
  }
  return bytes;
}

interface ClassRow {
  id: string;
  name: string;
  teacher: string | null;
  status: "ACTIVE" | "INACTIVE" | "PAUSED";
  _count: { students: number };
}

interface StudentRow {
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  grade: string | null;
  studentPhone: string | null;
  parents: { parentId: string; name: string; phone: string }[];
}

interface Template {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

interface HistoryRow {
  id: string;
  msgType: "SMS" | "LMS" | "MMS";
  title: string | null;
  content: string;
  sentAt: string;
  recipientCount: number;
  successCount: number;
  failCount: number;
  resultMessage: string | null;
  testMode: boolean;
}

type RecipientKey = string; // `${kind}__${id}__${phone}` to dedupe

interface PickedRecipient {
  key: RecipientKey;
  kind: "student" | "parent" | "manual";
  parentId: string | null;
  phone: string;
  label: string;
}

function studentKey(s: StudentRow): RecipientKey {
  return `student__${s.studentId}__${s.studentPhone || ""}`;
}
function parentKey(parentId: string, phone: string): RecipientKey {
  return `parent__${parentId}__${phone}`;
}

export default function MessagesPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [classQuery, setClassQuery] = useState("");

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [studentQuery, setStudentQuery] = useState("");
  const [recipients, setRecipients] = useState<Map<RecipientKey, PickedRecipient>>(new Map());
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [testMode, setTestMode] = useState(true);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState("");

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  async function loadClasses() {
    const res = await fetch("/api/admin/classes");
    const data = await res.json();
    if (Array.isArray(data)) setClasses(data);
  }

  async function loadTemplates() {
    const res = await fetch("/api/admin/messages/templates");
    const data = await res.json();
    if (Array.isArray(data)) setTemplates(data);
  }

  async function loadHistory() {
    const res = await fetch("/api/admin/messages/history?mine=true&take=10");
    const data = await res.json();
    if (Array.isArray(data)) setHistory(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadClasses();
    loadTemplates();
    loadHistory();
  }, []);

  async function fetchRecipients() {
    if (selectedClassIds.length === 0) {
      alert("수강반을 선택해주세요.");
      return;
    }
    setLoadingRecipients(true);
    setResult(null);
    try {
      const res = await fetch(
        `/api/admin/messages/recipients?classIds=${encodeURIComponent(selectedClassIds.join(","))}`
      );
      const data = await res.json();
      setStudents(Array.isArray(data.students) ? data.students : []);
    } catch {
      alert("수신자 정보를 불러오지 못했습니다.");
    } finally {
      setLoadingRecipients(false);
    }
  }

  function toggleClass(id: string) {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function addRecipient(r: PickedRecipient) {
    setRecipients((prev) => {
      if (prev.has(r.key)) return prev;
      const next = new Map(prev);
      next.set(r.key, r);
      return next;
    });
  }

  function removeRecipient(key: RecipientKey) {
    setRecipients((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }

  function toggleStudent(s: StudentRow) {
    if (!s.studentPhone) return;
    const key = studentKey(s);
    if (recipients.has(key)) removeRecipient(key);
    else
      addRecipient({
        key,
        kind: "student",
        parentId: null,
        phone: s.studentPhone,
        label: `${s.studentName} (학생)`,
      });
  }

  function toggleParent(s: StudentRow, parentId: string, phone: string, name: string) {
    const key = parentKey(parentId, phone);
    if (recipients.has(key)) removeRecipient(key);
    else
      addRecipient({
        key,
        kind: "parent",
        parentId,
        phone,
        label: `${s.studentName} 학부모(${name})`,
      });
  }

  function selectAllStudents() {
    students.forEach((s) => {
      if (!s.studentPhone) return;
      addRecipient({
        key: studentKey(s),
        kind: "student",
        parentId: null,
        phone: s.studentPhone,
        label: `${s.studentName} (학생)`,
      });
    });
  }

  function selectAllParents() {
    students.forEach((s) => {
      s.parents.forEach((p) => {
        addRecipient({
          key: parentKey(p.parentId, p.phone),
          kind: "parent",
          parentId: p.parentId,
          phone: p.phone,
          label: `${s.studentName} 학부모(${p.name})`,
        });
      });
    });
  }

  function reset() {
    setSelectedClassIds([]);
    setStudents([]);
    setRecipients(new Map());
    setTitle("");
    setContent("");
    setResult(null);
  }

  async function handleSend() {
    if (recipients.size === 0) {
      alert("수신자를 선택해주세요.");
      return;
    }
    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }
    const list = Array.from(recipients.values());
    const note = testMode ? " (테스트 모드)" : "";
    if (!confirm(`총 ${list.length}건의 ${msgType}를 발송하시겠습니까?${note}`)) return;

    setSending(true);
    setResult(null);
    try {
      const parentIds = list.filter((r) => r.parentId).map((r) => r.parentId!);
      const phones = list.filter((r) => !r.parentId).map((r) => r.phone);

      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentIds,
          phones,
          title: title || null,
          content,
          testMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, text: data.error || "발송 실패" });
      } else {
        const skipped = data.skippedOptOut > 0 ? ` · SMS 거부 ${data.skippedOptOut}명 제외` : "";
        const scheduled = data.scheduled
          ? ` · ${data.scheduled.rdate.slice(4, 6)}/${data.scheduled.rdate.slice(6, 8)} ${data.scheduled.rtime.slice(0, 2)}:${data.scheduled.rtime.slice(2)} 예약`
          : "";
        setResult({
          ok: data.ok,
          text: data.ok
            ? `발송 완료: ${data.successCount}/${data.recipientCount}건${testMode ? " (테스트)" : ""}${skipped}${scheduled}`
            : `발송 실패: ${data.resultMessage}`,
        });
        loadHistory();
      }
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : "발송 오류" });
    } finally {
      setSending(false);
    }
  }

  async function saveTemplate() {
    const t = newTemplateTitle.trim();
    if (!t) return alert("템플릿 제목을 입력해주세요.");
    if (!content.trim()) return alert("메시지를 먼저 입력해주세요.");
    const res = await fetch("/api/admin/messages/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t, content }),
    });
    if (res.ok) {
      setNewTemplateTitle("");
      loadTemplates();
    } else {
      const data = await res.json();
      alert(data.error || "저장 실패");
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm("이 템플릿을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/admin/messages/templates/${id}`, { method: "DELETE" });
    if (res.ok) loadTemplates();
  }

  const filteredClasses = useMemo(() => {
    const q = classQuery.trim().toLowerCase();
    return classes
      .filter((c) => c.status === "ACTIVE")
      .filter(
        (c) =>
          q === "" ||
          c.name.toLowerCase().includes(q) ||
          (c.teacher || "").toLowerCase().includes(q)
      );
  }, [classes, classQuery]);

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q) ||
        s.parents.some((p) => p.name.toLowerCase().includes(q))
    );
  }, [students, studentQuery]);

  const byteLen = getByteLength(content);
  const msgType = byteLen <= 90 ? "SMS" : "LMS";
  const recipientList = Array.from(recipients.values());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">메시지 발송</h1>
          <p className="text-gray-500 mt-1 text-sm">알리고 SMS API로 학부모/학생에게 발송합니다.</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={testMode}
            onChange={(e) => setTestMode(e.target.checked)}
            className="rounded"
          />
          <span className={testMode ? "text-amber-700 font-medium" : "text-gray-600"}>
            테스트 모드 {testMode ? "(실발송 없음)" : "(실발송)"}
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1 — Class picker */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>1. 수강반 선택</span>
              {selectedClassIds.length > 0 && (
                <Badge variant="default">{selectedClassIds.length}개</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="수업명 또는 강사 검색"
              value={classQuery}
              onChange={(e) => setClassQuery(e.target.value)}
            />
            <div className="max-h-64 overflow-y-auto border rounded-lg p-2 space-y-1">
              {filteredClasses.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  {classes.length === 0 ? "등록된 수업이 없습니다." : "검색 결과가 없습니다."}
                </p>
              ) : (
                filteredClasses.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClassIds.includes(c.id)}
                      onChange={() => toggleClass(c.id)}
                      className="rounded"
                    />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {c.teacher || "-"} · {c._count.students}명
                    </span>
                  </label>
                ))
              )}
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={fetchRecipients}
              disabled={loadingRecipients || selectedClassIds.length === 0}
            >
              {loadingRecipients ? "불러오는 중..." : "선택반 학생/학부모 불러오기"}
            </Button>
          </CardContent>
        </Card>

        {/* Card 2 — Recipient picker */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>2. 수신자 선택</span>
              <Badge variant="default">{recipients.size}명</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {students.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                수강반을 선택하고 &ldquo;선택반 학생/학부모 불러오기&rdquo;를 누르세요.
              </p>
            ) : (
              <>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={selectAllStudents}>
                    학생 전체
                  </Button>
                  <Button size="sm" variant="outline" onClick={selectAllParents}>
                    학부모 전체
                  </Button>
                  <Input
                    className="flex-1 min-w-[140px] h-8"
                    placeholder="이름/반 검색"
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                  />
                </div>
                <div className="max-h-56 overflow-y-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-2 font-medium text-gray-600">반/이름</th>
                        <th className="p-2 w-16 text-center font-medium text-gray-600">학생</th>
                        <th className="p-2 font-medium text-gray-600">학부모</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredStudents.map((s) => (
                        <tr key={s.studentId} className="hover:bg-gray-50">
                          <td className="p-2 text-xs">
                            <div className="text-gray-400">{s.className}</div>
                            <div className="font-medium">{s.studentName}</div>
                          </td>
                          <td className="p-2 text-center">
                            {s.studentPhone ? (
                              <input
                                type="checkbox"
                                checked={recipients.has(studentKey(s))}
                                onChange={() => toggleStudent(s)}
                              />
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="p-2">
                            {s.parents.length === 0 ? (
                              <span className="text-gray-300">-</span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {s.parents.map((p) => (
                                  <label
                                    key={p.parentId}
                                    className="flex items-center gap-1 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={recipients.has(parentKey(p.parentId, p.phone))}
                                      onChange={() => toggleParent(s, p.parentId, p.phone, p.name)}
                                    />
                                    <span>{p.name}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {recipientList.length > 0 && (
                  <div className="border-t pt-2 flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {recipientList.map((r) => (
                      <span
                        key={r.key}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-800"
                      >
                        {r.label}
                        <button
                          onClick={() => removeRecipient(r.key)}
                          className="text-gray-400 hover:text-red-500"
                          aria-label="제거"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 3 — Compose & send */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">3. 내용 작성 및 발송</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap items-center">
              <select
                value=""
                onChange={(e) => {
                  const t = templates.find((x) => x.id === e.target.value);
                  if (t) {
                    setContent(t.content);
                    if (!title && t.title) setTitle(t.title);
                  }
                }}
                className="h-8 text-sm rounded-md border border-gray-300 px-2 max-w-[200px]"
              >
                <option value="">템플릿 선택...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTemplates(true)}
                type="button"
              >
                <FileText className="h-4 w-4 mr-1" />
                템플릿 관리
              </Button>
            </div>

            <Input
              placeholder="제목 (LMS인 경우만 사용, 44byte 이내)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              rows={8}
              placeholder="메시지 내용을 입력하세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <div className={`text-xs ${byteLen > 2000 ? "text-red-600" : "text-gray-500"}`}>
              {byteLen} byte · {msgType} · 대상 {recipients.size}명
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="템플릿 제목"
                value={newTemplateTitle}
                onChange={(e) => setNewTemplateTitle(e.target.value)}
                className="h-8"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={saveTemplate}
                disabled={!newTemplateTitle.trim() || !content.trim()}
                type="button"
              >
                현재 메시지 저장
              </Button>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={handleSend}
                disabled={sending || recipients.size === 0 || !content.trim()}
                type="button"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? "발송 중..." : `${msgType} 발송`}
              </Button>
              <Button variant="outline" onClick={reset} type="button" disabled={sending}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {result && (
              <div
                className={`text-sm rounded-lg p-3 border ${
                  result.ok
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {result.text}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 4 — Recent history */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">4. 최근 발송 이력 (내 발송)</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">발송 이력이 없습니다.</p>
            ) : (
              <ul className="divide-y text-sm">
                {history.map((h) => (
                  <li key={h.id} className="py-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge variant={h.failCount > 0 ? "warning" : "success"}>
                          {h.msgType}
                        </Badge>
                        {h.testMode && <Badge variant="secondary">테스트</Badge>}
                        <span className="text-xs text-gray-500">
                          {h.successCount}/{h.recipientCount}
                          {h.failCount > 0 ? ` (실패 ${h.failCount})` : ""}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(h.sentAt).toLocaleString("ko-KR")}
                      </span>
                    </div>
                    {h.title && <p className="text-xs font-medium mt-1">{h.title}</p>}
                    <p className="text-xs text-gray-600 line-clamp-2">{h.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Template management modal */}
      {showTemplates && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowTemplates(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-lg max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">템플릿 관리</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-400 hover:text-gray-700"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {templates.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">저장된 템플릿이 없습니다.</p>
              ) : (
                <ul className="divide-y">
                  {templates.map((t) => (
                    <li key={t.id} className="py-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{t.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 whitespace-pre-wrap">
                          {t.content}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setContent(t.content);
                            setTitle((cur) => cur || t.title);
                            setShowTemplates(false);
                          }}
                        >
                          불러오기
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => deleteTemplate(t.id)}
                          aria-label="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
