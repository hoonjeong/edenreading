"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Question {
  id: string;
  questionNo: number;
  type: "OBJECTIVE" | "ESSAY";
  points: number;
  answer: string | null;
  subjectArea: string | null;
  readingLevel: string | null;
  description: string | null;
  solution: string | null;
  analysis: string | null;
  teacherTip: string | null;
  problemText: string | null;
}

interface Examinee {
  id: string;
  student: { id: string; name: string; grade: string | null };
  totalScore: number | null;
  isAbsent: boolean;
  teacherComment: string | null;
  commentType: string;
  isShared: boolean;
}

interface ExamData {
  id: string;
  name: string;
  grade: string | null;
  quarter: number | null;
  examDate: string | null;
  totalScore: number;
  status: string;
  questions: Question[];
  examinees: Examinee[];
}

const subjectAreas = [
  { value: "LISTENING_SPEAKING", label: "듣기말하기" },
  { value: "VOCABULARY", label: "어휘" },
  { value: "GRAMMAR", label: "문법" },
  { value: "READING", label: "읽기" },
  { value: "WRITING", label: "쓰기" },
  { value: "LITERATURE", label: "문학" },
  { value: "MEDIA", label: "매체" },
];

const readingLevels = [
  { value: "FACTUAL", label: "사실적" },
  { value: "INFERENTIAL", label: "추론적" },
  { value: "RECEPTIVE_PRODUCTIVE", label: "수용과생산" },
  { value: "LITERARY_UNDERSTANDING", label: "작품이해" },
];

const subjectAreaLabel = (v: string | null) => subjectAreas.find(s => s.value === v)?.label || "";
const readingLevelLabel = (v: string | null) => readingLevels.find(r => r.value === v)?.label || "";

type Tab = "questions" | "examinees" | "grading" | "report";

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<ExamData | null>(null);
  const [tab, setTab] = useState<Tab>("questions");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  useEffect(() => { loadExam(); }, []);

  async function loadExam() {
    const res = await fetch(`/api/admin/exams/${params.id}`);
    const data = await res.json();
    setExam(data);
  }

  async function saveQuestions() {
    if (!exam) return;
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/admin/exams/${params.id}/questions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions: exam.questions }),
    });
    setSaving(false);
    if (res.ok) { setMessage("문항이 저장되었습니다."); loadExam(); }
  }

  async function addExaminees(studentIds: string[]) {
    await fetch(`/api/admin/exams/${params.id}/examinees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentIds }),
    });
    loadExam();
  }

  async function changeStatus(status: string) {
    await fetch(`/api/admin/exams/${params.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadExam();
  }

  async function shareAll() {
    const ungraded = exam?.examinees.filter(e => e.totalScore === null && !e.isAbsent);
    if (ungraded && ungraded.length > 0) {
      alert(`채점되지 않은 학생이 ${ungraded.length}명 있습니다. 전원 채점 후 공유해주세요.`);
      return;
    }
    const notifySms = confirm("학부모에게 SMS도 함께 발송하시겠습니까?\n(취소시 인앱 알림만 발송)");
    await fetch(`/api/admin/exams/${params.id}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifySms }),
    });
    setMessage(notifySms ? "학부모에게 공유 + SMS 발송되었습니다." : "학부모에게 공유되었습니다.");
    loadExam();
  }

  if (!exam) return <div className="p-8 text-center text-gray-400">로딩 중...</div>;

  const totalPoints = exam.questions.reduce((sum, q) => sum + (q.points || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{exam.name}</h1>
          <p className="text-gray-500">
            {exam.grade && `${exam.grade} · `}
            {exam.quarter && `${exam.quarter}분기 · `}
            총점 {totalPoints}점
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Status change */}
          <select
            value={exam.status}
            onChange={(e) => changeStatus(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2"
          >
            <option value="WRITING">작성중</option>
            <option value="TESTING">시험중</option>
            <option value="GRADING">채점중</option>
            <option value="SHARED">공유됨</option>
          </select>
          {exam.status !== "SHARED" && (
            <Button size="sm" onClick={shareAll}>학부모 공유</Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {([
          { key: "questions" as Tab, label: `문항 (${exam.questions.length})` },
          { key: "examinees" as Tab, label: `응시자 (${exam.examinees.length})` },
          { key: "grading" as Tab, label: "채점" },
          { key: "report" as Tab, label: "리포트" },
        ]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${tab === t.key ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}

      {/* Questions Tab */}
      {tab === "questions" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">문항 정보</CardTitle>
            <Button onClick={saveQuestions} disabled={saving} size="sm">{saving ? "저장 중..." : "문항 저장"}</Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-2 text-left w-10">번호</th>
                    <th className="p-2 text-left w-14">유형</th>
                    <th className="p-2 text-left w-16">배점</th>
                    <th className="p-2 text-left w-16">정답</th>
                    <th className="p-2 text-left">영역</th>
                    <th className="p-2 text-left">독해수준</th>
                    <th className="p-2 text-left w-10">상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {exam.questions.map((q, i) => (
                    <>
                      <tr key={q.id} className="hover:bg-gray-50">
                        <td className="p-2 font-medium">{q.questionNo}</td>
                        <td className="p-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${q.type === "OBJECTIVE" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                            {q.type === "OBJECTIVE" ? "객관" : "서술"}
                          </span>
                        </td>
                        <td className="p-2">
                          <Input type="number" className="w-16 h-7 text-xs" value={q.points}
                            onChange={(e) => { const u = [...exam.questions]; u[i] = { ...u[i], points: Number(e.target.value) }; setExam({ ...exam, questions: u }); }} />
                        </td>
                        <td className="p-2">
                          {q.type === "OBJECTIVE" && (
                            <Input className="w-14 h-7 text-xs" value={q.answer || ""} placeholder="-"
                              onChange={(e) => { const u = [...exam.questions]; u[i] = { ...u[i], answer: e.target.value }; setExam({ ...exam, questions: u }); }} />
                          )}
                        </td>
                        <td className="p-2">
                          <select className="h-7 text-xs border rounded px-1" value={q.subjectArea || ""}
                            onChange={(e) => { const u = [...exam.questions]; u[i] = { ...u[i], subjectArea: e.target.value || null }; setExam({ ...exam, questions: u }); }}>
                            <option value="">선택</option>
                            {subjectAreas.map((sa) => <option key={sa.value} value={sa.value}>{sa.label}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <select className="h-7 text-xs border rounded px-1" value={q.readingLevel || ""}
                            onChange={(e) => { const u = [...exam.questions]; u[i] = { ...u[i], readingLevel: e.target.value || null }; setExam({ ...exam, questions: u }); }}>
                            <option value="">선택</option>
                            {readingLevels.map((rl) => <option key={rl.value} value={rl.value}>{rl.label}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <button className="text-xs text-blue-600 hover:underline" onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}>
                            {expandedQ === q.id ? "접기" : "펼치기"}
                          </button>
                        </td>
                      </tr>
                      {expandedQ === q.id && (
                        <tr key={`${q.id}-detail`}>
                          <td colSpan={7} className="p-3 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div>
                                <Label className="text-xs">문항 설명</Label>
                                <Textarea className="text-xs mt-1" rows={2} value={q.description || ""}
                                  onChange={(e) => { const u = [...exam.questions]; u[i] = { ...u[i], description: e.target.value }; setExam({ ...exam, questions: u }); }} placeholder="문항 설명" />
                              </div>
                              <div>
                                <Label className="text-xs">해설</Label>
                                <Textarea className="text-xs mt-1" rows={2} value={q.solution || ""}
                                  onChange={(e) => { const u = [...exam.questions]; u[i] = { ...u[i], solution: e.target.value }; setExam({ ...exam, questions: u }); }} placeholder="해설" />
                              </div>
                              <div>
                                <Label className="text-xs">오답 분석</Label>
                                <Textarea className="text-xs mt-1" rows={2} value={q.analysis || ""}
                                  onChange={(e) => { const u = [...exam.questions]; u[i] = { ...u[i], analysis: e.target.value }; setExam({ ...exam, questions: u }); }} placeholder="오답 분석" />
                              </div>
                              <div>
                                <Label className="text-xs">교사 팁</Label>
                                <Textarea className="text-xs mt-1" rows={2} value={q.teacherTip || ""}
                                  onChange={(e) => { const u = [...exam.questions]; u[i] = { ...u[i], teacherTip: e.target.value }; setExam({ ...exam, questions: u }); }} placeholder="교사 팁" />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Examinees Tab */}
      {tab === "examinees" && <ExamineesTab exam={exam} onAdd={addExaminees} onReload={loadExam} />}

      {/* Grading Tab */}
      {tab === "grading" && <GradingTab exam={exam} onReload={loadExam} />}

      {/* Report Tab */}
      {tab === "report" && <ReportTab exam={exam} />}
    </div>
  );
}

function ExamineesTab({ exam, onAdd, onReload }: { exam: ExamData; onAdd: (ids: string[]) => void; onReload: () => void }) {
  const [students, setStudents] = useState<{ id: string; name: string; grade: string | null }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/students").then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        const existingIds = exam.examinees.map(e => e.student.id);
        setStudents(data.filter((s: { id: string }) => !existingIds.includes(s.id)));
      }
    });
  }, [exam.examinees]);

  async function toggleAbsent(examineeId: string, isAbsent: boolean) {
    await fetch(`/api/admin/exams/${exam.id}/examinees/${examineeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAbsent }),
    });
    onReload();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg">응시자 목록</CardTitle></CardHeader>
        <CardContent>
          {exam.examinees.length === 0 ? (
            <p className="text-gray-400 text-center py-4">응시자가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {exam.examinees.map(ex => (
                <div key={ex.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{ex.student.name}</span>
                    {ex.isAbsent && <Badge variant="destructive">결시</Badge>}
                    {ex.isShared && <Badge variant="success">공유</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{ex.isAbsent ? "-" : ex.totalScore !== null ? `${ex.totalScore}점` : "미채점"}</span>
                    <button onClick={() => toggleAbsent(ex.id, !ex.isAbsent)}
                      className={`text-xs px-2 py-1 rounded ${ex.isAbsent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {ex.isAbsent ? "출석처리" : "결시처리"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {students.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">학생 추가</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
              {students.map(s => (
                <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selected.includes(s.id)} onChange={e => {
                    if (e.target.checked) setSelected([...selected, s.id]);
                    else setSelected(selected.filter(id => id !== s.id));
                  }} />
                  <span className="text-sm">{s.name} {s.grade ? `(${s.grade})` : ""}</span>
                </label>
              ))}
            </div>
            <Button onClick={() => { onAdd(selected); setSelected([]); }} disabled={selected.length === 0} size="sm">{selected.length}명 추가</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GradingTab({ exam, onReload }: { exam: ExamData; onReload: () => void }) {
  const [selectedExaminee, setSelectedExaminee] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [essayScores, setEssayScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [commentType, setCommentType] = useState("PARENT_VISIBLE");
  const [grading, setGrading] = useState(false);
  const objectiveInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const objectiveQs = exam.questions.filter(q => q.type === "OBJECTIVE");
  const essayQs = exam.questions.filter(q => q.type === "ESSAY");

  async function loadAnswers(examineeId: string) {
    setSelectedExaminee(examineeId);
    const ex = exam.examinees.find(e => e.id === examineeId);
    setComment(ex?.teacherComment || "");
    setCommentType(ex?.commentType || "PARENT_VISIBLE");

    const res = await fetch(`/api/admin/exams/${exam.id}/answers?examineeId=${examineeId}`);
    const data = await res.json();
    const aMap: Record<string, string> = {};
    const sMap: Record<string, number> = {};
    if (Array.isArray(data)) {
      data.forEach((a: { questionId: string; answer: string; score: number | null }) => {
        aMap[a.questionId] = a.answer || "";
        if (a.score !== null) sMap[a.questionId] = a.score;
      });
    }
    setAnswers(aMap);
    setEssayScores(sMap);
  }

  async function gradeExaminee() {
    if (!selectedExaminee) return;
    setGrading(true);
    await fetch(`/api/admin/exams/${exam.id}/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examineeId: selectedExaminee, answers, essayScores, comment, commentType }),
    });
    setGrading(false);
    onReload();
  }

  // 키보드 자동 이동 (객관식)
  function handleObjectiveKeyDown(e: React.KeyboardEvent<HTMLInputElement>, qId: string) {
    if (e.key >= "1" && e.key <= "9") {
      const idx = objectiveQs.findIndex(q => q.id === qId);
      if (idx < objectiveQs.length - 1) {
        setTimeout(() => objectiveInputRefs.current[objectiveQs[idx + 1].id]?.focus(), 50);
      }
    }
  }

  return (
    <div className="space-y-4">
      {exam.examinees.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-gray-400">먼저 응시자를 추가해주세요.</CardContent></Card>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {exam.examinees.filter(e => !e.isAbsent).map(ex => (
              <button key={ex.id} onClick={() => loadAnswers(ex.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedExaminee === ex.id ? "bg-blue-600 text-white" : "bg-white border hover:bg-gray-50"
                }`}>
                {ex.student.name}{ex.totalScore !== null ? ` (${ex.totalScore}점)` : ""}
              </button>
            ))}
          </div>

          {selectedExaminee && (
            <>
              {/* 객관식 답안 */}
              {objectiveQs.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">객관식 답안 ({objectiveQs.length}문항)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {objectiveQs.map(q => {
                        const isAnswered = (answers[q.id] || "").trim() !== "";
                        const isCorrect = isAnswered && answers[q.id]?.trim() === q.answer?.trim();
                        return (
                          <div key={q.id} className="text-center">
                            <p className="text-xs text-gray-500 mb-1">{q.questionNo}</p>
                            <Input
                              ref={(el) => { objectiveInputRefs.current[q.id] = el; }}
                              className={`h-8 text-center text-sm ${isAnswered ? (isCorrect ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50") : ""}`}
                              value={answers[q.id] || ""}
                              onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                              onKeyDown={e => handleObjectiveKeyDown(e, q.id)}
                              placeholder="-"
                            />
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">숫자 입력 시 다음 문항으로 자동 이동</p>
                  </CardContent>
                </Card>
              )}

              {/* 서술형 채점 */}
              {essayQs.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">서술형 채점 ({essayQs.length}문항)</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {essayQs.map(q => (
                      <div key={q.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">문항 {q.questionNo} (배점 {q.points}점)</span>
                          <span className="text-xs text-gray-500">{subjectAreaLabel(q.subjectArea)} · {readingLevelLabel(q.readingLevel)}</span>
                        </div>
                        {q.description && <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{q.description}</p>}
                        <div>
                          <Label className="text-xs">학생 답안</Label>
                          <Textarea className="text-sm mt-1" rows={3} value={answers[q.id] || ""}
                            onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} placeholder="학생 답안 입력" />
                        </div>
                        <div className="flex items-center gap-3">
                          <Label className="text-xs">점수</Label>
                          <Input type="number" className="w-20 h-8 text-sm" min={0} max={q.points}
                            value={essayScores[q.id] ?? ""} onChange={e => setEssayScores({ ...essayScores, [q.id]: Number(e.target.value) })} />
                          <span className="text-xs text-gray-500">/ {q.points}점</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* 교사 코멘트 */}
              <Card>
                <CardHeader><CardTitle className="text-lg">교사 코멘트</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="학생에 대한 코멘트를 작성하세요" rows={3} />
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input type="radio" checked={commentType === "PARENT_VISIBLE"} onChange={() => setCommentType("PARENT_VISIBLE")} />
                      학부모 공개
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input type="radio" checked={commentType === "INTERNAL_ONLY"} onChange={() => setCommentType("INTERNAL_ONLY")} />
                      내부용
                    </label>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={gradeExaminee} disabled={grading} className="w-full">
                {grading ? "채점 중..." : "채점 완료"}
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}

interface QStat {
  questionId: string;
  questionNo: number;
  type: string;
  points: number;
  subjectArea: string | null;
  answered: number;
  correct: number;
  avgScore: number;
  correctRate: number;
  avgScoreRate: number;
}
interface AreaAvg {
  subjectArea: string;
  avgRate: number;
  questionCount: number;
}
interface StatsData {
  examineeCount: number;
  questions: QStat[];
  areaAverages: AreaAvg[];
}

function ReportTab({ exam }: { exam: ExamData }) {
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    fetch(`/api/admin/exams/${exam.id}/stats`)
      .then((r) => r.json())
      .then((d) => setStats(d));
  }, [exam.id]);

  const gradedExaminees = exam.examinees.filter(e => e.totalScore !== null && !e.isAbsent);
  const avgScore = gradedExaminees.length > 0
    ? Math.round(gradedExaminees.reduce((sum, e) => sum + (e.totalScore || 0), 0) / gradedExaminees.length)
    : 0;
  const maxScore = Math.max(...gradedExaminees.map(e => e.totalScore || 0), 0);
  const totalPoints = exam.questions.reduce((sum, q) => sum + (q.points || 0), 0);

  // 영역별 분석 (문항 배점 기준)
  const areaStats: Record<string, { total: number; count: number }> = {};
  exam.questions.forEach(q => {
    if (q.subjectArea) {
      if (!areaStats[q.subjectArea]) areaStats[q.subjectArea] = { total: 0, count: 0 };
      areaStats[q.subjectArea].total += q.points;
      areaStats[q.subjectArea].count++;
    }
  });

  return (
    <div className="space-y-4">
      {/* 전체 통계 */}
      <Card>
        <CardHeader><CardTitle className="text-lg">시험 통계</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{totalPoints}</p>
              <p className="text-xs text-gray-500">만점</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{avgScore}</p>
              <p className="text-xs text-gray-500">평균</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{maxScore}</p>
              <p className="text-xs text-gray-500">최고점</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{gradedExaminees.length}</p>
              <p className="text-xs text-gray-500">응시자</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 영역별 배점 분포 */}
      <Card>
        <CardHeader><CardTitle className="text-lg">영역별 분포</CardTitle></CardHeader>
        <CardContent>
          {Object.entries(areaStats).map(([area, stat]) => {
            const label = subjectAreas.find(s => s.value === area)?.label || area;
            const pct = totalPoints > 0 ? Math.round((stat.total / totalPoints) * 100) : 0;
            return (
              <div key={area} className="flex items-center gap-3 mb-2">
                <span className="text-sm w-20 text-right">{label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full flex items-center justify-end pr-2" style={{ width: `${pct}%` }}>
                    <span className="text-xs text-white font-medium">{stat.total}점</span>
                  </div>
                </div>
                <span className="text-xs text-gray-500 w-12">{stat.count}문항</span>
              </div>
            );
          })}
          {Object.keys(areaStats).length === 0 && <p className="text-sm text-gray-400">영역을 설정해주세요.</p>}
        </CardContent>
      </Card>

      {/* 영역별 평균 정답률 */}
      {stats && stats.areaAverages.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">영역별 평균 정답률</CardTitle></CardHeader>
          <CardContent>
            {stats.areaAverages.map((a) => {
              const label = subjectAreas.find((s) => s.value === a.subjectArea)?.label || a.subjectArea;
              const color = a.avgRate >= 70 ? "bg-green-500" : a.avgRate >= 40 ? "bg-yellow-500" : "bg-red-500";
              return (
                <div key={a.subjectArea} className="flex items-center gap-3 mb-2">
                  <span className="text-sm w-20 text-right">{label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div className={`${color} h-full rounded-full flex items-center justify-end pr-2`} style={{ width: `${a.avgRate}%` }}>
                      <span className="text-xs text-white font-medium">{a.avgRate}%</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-12">{a.questionCount}문항</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* 문항별 정답률 */}
      {stats && stats.questions.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">문항별 정답률 (응시 {stats.examineeCount}명)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-2 text-center w-12">번호</th>
                    <th className="p-2 text-left">영역/유형</th>
                    <th className="p-2 text-center">배점</th>
                    <th className="p-2 text-center">평균</th>
                    <th className="p-2 text-left">정답률</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.questions.map((q) => {
                    const rate = q.type === "OBJECTIVE" ? q.correctRate : q.avgScoreRate;
                    const color = rate >= 70 ? "bg-green-500" : rate >= 40 ? "bg-yellow-500" : "bg-red-500";
                    return (
                      <tr key={q.questionId} className="hover:bg-gray-50">
                        <td className="p-2 text-center font-medium">{q.questionNo}</td>
                        <td className="p-2 text-xs text-gray-600">
                          {subjectAreaLabel(q.subjectArea)}
                          {q.subjectArea && " · "}
                          {q.type === "OBJECTIVE" ? "객관식" : "서술형"}
                        </td>
                        <td className="p-2 text-center">{q.points}</td>
                        <td className="p-2 text-center">{q.avgScore}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                              <div className={`${color} h-full`} style={{ width: `${rate}%` }} />
                            </div>
                            <span className="text-xs text-gray-600 w-10 text-right">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 학생별 결과 */}
      <Card>
        <CardHeader><CardTitle className="text-lg">학생별 결과</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 text-left">이름</th>
                  <th className="p-3 text-center">점수</th>
                  <th className="p-3 text-center">만점대비</th>
                  <th className="p-3 text-center">평균대비</th>
                  <th className="p-3 text-left">코멘트</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {exam.examinees.map(ex => {
                  const pctOfMax = totalPoints > 0 && ex.totalScore !== null ? Math.round((ex.totalScore / totalPoints) * 100) : 0;
                  const pctOfAvg = avgScore > 0 && ex.totalScore !== null ? Math.round((ex.totalScore / avgScore) * 100) : 0;
                  return (
                    <tr key={ex.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">
                        {ex.student.name}
                        {ex.isAbsent && <Badge variant="destructive" className="ml-1">결시</Badge>}
                      </td>
                      <td className="p-3 text-center font-bold">{ex.isAbsent ? "-" : ex.totalScore ?? "-"}</td>
                      <td className="p-3 text-center">{ex.isAbsent ? "-" : `${pctOfMax}%`}</td>
                      <td className="p-3 text-center">
                        {ex.isAbsent ? "-" : (
                          <span className={pctOfAvg >= 100 ? "text-green-600" : "text-red-600"}>{pctOfAvg}%</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-gray-600 max-w-[200px] truncate">{ex.teacherComment || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
