"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, AlertTriangle, FileSpreadsheet } from "lucide-react";

interface ClassResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; name: string; error: string }[];
}

interface StudentResult {
  total: number;
  studentCreated: number;
  studentUpdated: number;
  parentCreated: number;
  parentLinked: number;
  classLinked: number;
  classMissing: string[];
  skipped: number;
  errors: { row: number; name: string; error: string }[];
}

type Result =
  | { kind: "class"; data: ClassResult }
  | { kind: "student"; data: StudentResult }
  | { kind: "error"; message: string };

export default function ImportPage() {
  const [classFile, setClassFile] = useState<File | null>(null);
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [classBusy, setClassBusy] = useState(false);
  const [studentBusy, setStudentBusy] = useState(false);
  const [classResult, setClassResult] = useState<Result | null>(null);
  const [studentResult, setStudentResult] = useState<Result | null>(null);

  async function uploadClasses() {
    if (!classFile) return;
    setClassBusy(true);
    setClassResult(null);
    const fd = new FormData();
    fd.append("file", classFile);
    const res = await fetch("/api/admin/classes/import", { method: "POST", body: fd });
    const data = await res.json();
    setClassBusy(false);
    if (!res.ok) {
      setClassResult({ kind: "error", message: data.error || "오류" });
    } else {
      setClassResult({ kind: "class", data });
    }
  }

  async function uploadStudents() {
    if (!studentFile) return;
    setStudentBusy(true);
    setStudentResult(null);
    const fd = new FormData();
    fd.append("file", studentFile);
    const res = await fetch("/api/admin/students/import", { method: "POST", body: fd });
    const data = await res.json();
    setStudentBusy(false);
    if (!res.ok) {
      setStudentResult({ kind: "error", message: data.error || "오류" });
    } else {
      setStudentResult({ kind: "student", data });
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">엑셀 임포트</h1>
        <p className="text-gray-500 mt-1">수강반·학생 정보를 엑셀로 한 번에 등록합니다.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 flex gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium mb-1">진행 순서</p>
          <ol className="list-decimal pl-5 space-y-1 text-amber-800">
            <li>먼저 <b>수업목록</b>을 임포트합니다.</li>
            <li>다음 <b>원생목록</b>을 임포트합니다 — &ldquo;수업&rdquo; 컬럼으로 자동 연결됩니다.</li>
            <li>같은 파일을 다시 올려도 안전합니다 (이름·전화 기준 업데이트).</li>
          </ol>
        </div>
      </div>

      {/* 수업목록 */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold">1. 수업목록 임포트</h2>
          </div>
          <p className="text-sm text-gray-500">
            컬럼: 수업명, 구분, 수업료, 1회당수업료, 대상, 시작일, 종료일, 담임강사, 보조강사, 강의실, 정원, 상태
          </p>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setClassFile(e.target.files?.[0] || null)}
              className="text-sm flex-1"
            />
            <Button onClick={uploadClasses} disabled={!classFile || classBusy}>
              <Upload className="h-4 w-4 mr-2" />
              {classBusy ? "업로드 중..." : "임포트"}
            </Button>
          </div>
          {classResult && <ResultPanel result={classResult} />}
        </CardContent>
      </Card>

      {/* 원생목록 */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold">2. 원생목록 임포트</h2>
          </div>
          <p className="text-sm text-gray-500">
            컬럼: 이름, 성별, 학교, 학년, 보호자연락처, 보호자이름, 수업, 입학일, 휴원여부 등
          </p>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setStudentFile(e.target.files?.[0] || null)}
              className="text-sm flex-1"
            />
            <Button onClick={uploadStudents} disabled={!studentFile || studentBusy}>
              <Upload className="h-4 w-4 mr-2" />
              {studentBusy ? "업로드 중..." : "임포트"}
            </Button>
          </div>
          {studentResult && <ResultPanel result={studentResult} />}
        </CardContent>
      </Card>
    </div>
  );
}

function ResultPanel({ result }: { result: Result }) {
  if (result.kind === "error") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
        {result.message}
      </div>
    );
  }

  if (result.kind === "class") {
    const r = result.data;
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm space-y-2">
        <div className="flex items-center gap-2 text-green-800 font-medium">
          <CheckCircle2 className="h-4 w-4" />
          처리 완료 (총 {r.total}건)
        </div>
        <ul className="text-green-900 pl-6 space-y-0.5">
          <li>신규 등록: {r.created}건</li>
          <li>업데이트: {r.updated}건</li>
          <li>스킵: {r.skipped}건</li>
          {r.errors.length > 0 && <li className="text-red-700">실패: {r.errors.length}건</li>}
        </ul>
        {r.errors.length > 0 && <ErrorList errors={r.errors} />}
      </div>
    );
  }

  const r = result.data;
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm space-y-2">
      <div className="flex items-center gap-2 text-green-800 font-medium">
        <CheckCircle2 className="h-4 w-4" />
        처리 완료 (총 {r.total}건)
      </div>
      <ul className="text-green-900 pl-6 space-y-0.5">
        <li>학생 신규: {r.studentCreated}건 / 업데이트: {r.studentUpdated}건</li>
        <li>학부모 신규: {r.parentCreated}건 / 신규 연결: {r.parentLinked}건</li>
        <li>수강반 연결: {r.classLinked}건</li>
        <li>스킵: {r.skipped}건</li>
        {r.errors.length > 0 && <li className="text-red-700">실패: {r.errors.length}건</li>}
      </ul>
      {r.classMissing.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-2">
          <p className="font-medium text-amber-900 mb-1">
            매칭 실패한 수업명 ({r.classMissing.length}개)
          </p>
          <p className="text-xs text-amber-800 mb-2">
            먼저 수업목록을 임포트하거나 수업을 등록한 뒤 다시 시도하세요.
          </p>
          <ul className="text-xs text-amber-900 list-disc pl-5 space-y-0.5 max-h-32 overflow-y-auto">
            {r.classMissing.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
      )}
      {r.errors.length > 0 && <ErrorList errors={r.errors} />}
    </div>
  );
}

function ErrorList({ errors }: { errors: { row: number; name: string; error: string }[] }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
      <p className="font-medium text-red-800 mb-1">에러 상세</p>
      <ul className="text-xs text-red-900 list-disc pl-5 space-y-0.5 max-h-40 overflow-y-auto">
        {errors.map((e, i) => (
          <li key={i}>
            행 {e.row} · {e.name}: {e.error}
          </li>
        ))}
      </ul>
    </div>
  );
}
