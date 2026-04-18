import type { Session } from "next-auth";
import { prisma } from "./prisma";

// BR-A01: 선생님(TEACHER)은 본인이 담당한 학생만 접근. 원장(DIRECTOR)은 전체.
// 반환값:
//   null  → 전체 접근 (DIRECTOR)
//   string[] → 접근 가능한 student id 목록 (TEACHER, 빈 배열 가능)
export async function getAccessibleStudentIds(
  session: Session | null
): Promise<string[] | null> {
  if (!session?.user || session.user.userType !== "admin") return [];
  if (session.user.role === "DIRECTOR") return null;

  const rows = await prisma.adminStudent.findMany({
    where: { adminId: session.user.id },
    select: { studentId: true },
  });
  return rows.map((r) => r.studentId);
}

// 특정 학생에 대한 접근 권한 확인
export async function canAccessStudent(
  session: Session | null,
  studentId: string
): Promise<boolean> {
  const ids = await getAccessibleStudentIds(session);
  if (ids === null) return true;
  return ids.includes(studentId);
}

// Prisma where절용 helper. studentId 필드 기준 필터를 반환.
// 사용: where: { ...studentScopeWhere(ids), ...other }
export function studentScopeWhere(ids: string[] | null) {
  if (ids === null) return {};
  return { studentId: { in: ids } };
}
