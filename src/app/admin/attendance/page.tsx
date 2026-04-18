"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Student {
  id: string;
  name: string;
  grade: string | null;
}

interface AttendanceRecord {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "TARDY";
}

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/students")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStudents(data.map((s: Student) => ({ id: s.id, name: s.name, grade: s.grade })));
        }
      });
  }, []);

  useEffect(() => {
    // Load existing records for this date
    fetch(`/api/admin/attendance?date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRecords(data.map((a: AttendanceRecord & { studentId: string }) => ({
            studentId: a.studentId,
            status: a.status,
          })));
        }
      });
  }, [date]);

  function getStatus(studentId: string): "PRESENT" | "ABSENT" | "TARDY" {
    return records.find((r) => r.studentId === studentId)?.status || "PRESENT";
  }

  function setStatus(studentId: string, status: "PRESENT" | "ABSENT" | "TARDY") {
    setSaved(false);
    setRecords((prev) => {
      const existing = prev.find((r) => r.studentId === studentId);
      if (existing) {
        return prev.map((r) => r.studentId === studentId ? { ...r, status } : r);
      }
      return [...prev, { studentId, status }];
    });
  }

  function markAllPresent() {
    setSaved(false);
    setRecords(students.map((s) => ({ studentId: s.id, status: "PRESENT" as const })));
  }

  async function save() {
    setLoading(true);
    // Ensure all students have a record
    const allRecords = students.map((s) => ({
      studentId: s.id,
      status: getStatus(s.id),
    }));

    await fetch("/api/admin/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, records: allRecords }),
    });
    setLoading(false);
    setSaved(true);
  }

  const presentCount = students.filter((s) => getStatus(s.id) === "PRESENT").length;
  const tardyCount = students.filter((s) => getStatus(s.id) === "TARDY").length;
  const absentCount = students.filter((s) => getStatus(s.id) === "ABSENT").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">출결 관리</h1>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-auto"
        />
      </div>

      {/* Summary */}
      <div className="flex gap-3">
        <Badge variant="success" className="text-sm px-3 py-1">출석 {presentCount}</Badge>
        <Badge variant="warning" className="text-sm px-3 py-1">지각 {tardyCount}</Badge>
        <Badge variant="destructive" className="text-sm px-3 py-1">결석 {absentCount}</Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">출석 체크</CardTitle>
          <Button variant="outline" size="sm" onClick={markAllPresent}>전원 출석</Button>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-gray-400 text-center py-8">등록된 학생이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {students.map((student) => {
                const status = getStatus(student.id);
                return (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.grade || ""}</p>
                    </div>
                    <div className="flex gap-1">
                      {(["PRESENT", "TARDY", "ABSENT"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(student.id, s)}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            status === s
                              ? s === "PRESENT"
                                ? "bg-green-600 text-white"
                                : s === "TARDY"
                                ? "bg-yellow-500 text-white"
                                : "bg-red-600 text-white"
                              : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {s === "PRESENT" ? "출석" : s === "TARDY" ? "지각" : "결석"}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={save} className="flex-1" disabled={loading || students.length === 0}>
          {loading ? "저장 중..." : saved ? "저장 완료!" : "저장하기"}
        </Button>
      </div>

      {/* 월간 캘린더 통계 */}
      <MonthlyCalendar />
    </div>
  );
}

function MonthlyCalendar() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [stats, setStats] = useState<Record<string, { present: number; tardy: number; absent: number; total: number }>>({});

  useEffect(() => {
    fetch(`/api/admin/attendance/monthly?month=${month}`).then(r => r.json()).then(data => {
      if (data && !data.error) setStats(data);
    });
  }, [month]);

  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const firstDayOfWeek = new Date(year, mon - 1, 1).getDay();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">월간 출결 현황</CardTitle>
        <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-auto" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map(d => (
            <span key={d} className="text-gray-500 font-medium py-1">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = `${month}-${String(day).padStart(2, "0")}`;
            const stat = stats[dateKey];
            const hasData = stat && stat.total > 0;
            const allPresent = hasData && stat.absent === 0 && stat.tardy === 0;
            const hasAbsent = hasData && stat.absent > 0;
            const hasTardy = hasData && stat.tardy > 0 && stat.absent === 0;

            return (
              <div key={day} className={`p-1.5 rounded text-center text-xs ${
                !hasData ? "text-gray-300" :
                allPresent ? "bg-green-100 text-green-700" :
                hasAbsent ? "bg-red-100 text-red-700" :
                hasTardy ? "bg-yellow-100 text-yellow-700" : ""
              }`} title={hasData ? `출석${stat.present} 지각${stat.tardy} 결석${stat.absent}` : "미입력"}>
                {day}
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-gray-500 justify-center">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 rounded" /> 전원출석</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-100 rounded" /> 지각있음</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 rounded" /> 결석있음</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-100 rounded" /> 미입력</span>
        </div>
      </CardContent>
    </Card>
  );
}
