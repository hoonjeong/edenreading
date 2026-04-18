import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parseExcel,
  str,
  strOrNull,
  parseExcelDate,
  cleanPhone,
} from "@/lib/excel";
import { generateAuthCode } from "@/lib/utils";
import { requireAdmin } from "@/lib/route-middleware";

interface ImportResult {
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

function nextAuthCode(taken: Set<string>): string {
  for (let i = 0; i < 20; i++) {
    const code = generateAuthCode();
    if (!taken.has(code)) {
      taken.add(code);
      return code;
    }
  }
  // 충돌 가능성이 매우 낮은 fallback
  return generateAuthCode() + Math.random().toString(36).slice(2, 4).toUpperCase();
}

export const POST = requireAdmin(async (request) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = parseExcel(buffer);

    const result: ImportResult = {
      total: rows.length,
      studentCreated: 0,
      studentUpdated: 0,
      parentCreated: 0,
      parentLinked: 0,
      classLinked: 0,
      classMissing: [],
      skipped: 0,
      errors: [],
    };

    const [classes, parents, students, parentLinks, classLinks] = await Promise.all([
      prisma.class.findMany({ select: { id: true, name: true } }),
      prisma.parent.findMany({ select: { id: true, phone: true, authCode: true } }),
      prisma.student.findMany({
        select: {
          id: true,
          name: true,
          school: true,
          parents: { select: { parent: { select: { phone: true } } } },
        },
      }),
      prisma.parentStudent.findMany({ select: { parentId: true, studentId: true } }),
      prisma.classStudent.findMany({ select: { classId: true, studentId: true } }),
    ]);

    const classByName = new Map(classes.map((c) => [c.name, c.id]));
    const parentByPhone = new Map(parents.map((p) => [p.phone, p.id]));
    const takenAuthCodes = new Set(parents.map((p) => p.authCode).filter((c): c is string => !!c));
    const studentByNamePhone = new Map<string, string>();
    const studentByNameSchool = new Map<string, string>();
    for (const s of students) {
      if (s.school) studentByNameSchool.set(`${s.name}__${s.school}`, s.id);
      for (const ps of s.parents) {
        studentByNamePhone.set(`${s.name}__${ps.parent.phone}`, s.id);
      }
    }
    const parentLinkSet = new Set(parentLinks.map((l) => `${l.parentId}__${l.studentId}`));
    const classLinkSet = new Set(classLinks.map((l) => `${l.classId}__${l.studentId}`));
    const missingClassNames = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = str(row["이름"]);
      if (!name) {
        result.skipped++;
        continue;
      }

      try {
        const parentPhone = cleanPhone(row["보호자연락처"]);
        const parentName = strOrNull(row["보호자이름"]);
        const otherParentPhone = cleanPhone(row["기타보호자연락처"]);
        const otherParentName = strOrNull(row["기타보호자이름"]);
        const school = strOrNull(row["학교"]);

        const studentData = {
          name,
          gender: strOrNull(row["성별"]),
          school,
          grade: strOrNull(row["학년"]),
          classNo: strOrNull(row["반"]),
          studentPhone: cleanPhone(row["원생연락처"]),
          homePhone: cleanPhone(row["집전화"]),
          birthDate: parseExcelDate(row["생일"]),
          enrollDate: parseExcelDate(row["입학일"]),
          isActive: str(row["재원여부"]).toUpperCase() !== "X",
          isOnLeave: str(row["휴원여부"]).toUpperCase() === "O",
          leaveReason: strOrNull(row["휴원사유"]),
          siblingInfo: strOrNull(row["형제"]),
          studentCode: strOrNull(row["원생고유번호"]),
          memo: strOrNull(row["메모"]),
        };

        let studentId =
          (parentPhone && studentByNamePhone.get(`${name}__${parentPhone}`)) ||
          (school && studentByNameSchool.get(`${name}__${school}`)) ||
          null;

        if (studentId) {
          await prisma.student.update({ where: { id: studentId }, data: studentData });
          result.studentUpdated++;
        } else {
          const created = await prisma.student.create({ data: studentData });
          studentId = created.id;
          if (parentPhone) studentByNamePhone.set(`${name}__${parentPhone}`, created.id);
          if (school) studentByNameSchool.set(`${name}__${school}`, created.id);
          result.studentCreated++;
        }

        const parentInputs: { phone: string; name: string | null }[] = [];
        if (parentPhone) parentInputs.push({ phone: parentPhone, name: parentName });
        if (otherParentPhone)
          parentInputs.push({ phone: otherParentPhone, name: otherParentName });

        for (const p of parentInputs) {
          let parentId = parentByPhone.get(p.phone);
          if (!parentId) {
            const authCode = nextAuthCode(takenAuthCodes);
            const created = await prisma.parent.create({
              data: {
                name: p.name || `${name} 학부모`,
                phone: p.phone,
                authCode,
                authCodeExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            });
            parentId = created.id;
            parentByPhone.set(p.phone, parentId);
            result.parentCreated++;
          }

          const linkKey = `${parentId}__${studentId}`;
          if (!parentLinkSet.has(linkKey)) {
            await prisma.parentStudent.create({
              data: { parentId, studentId },
            });
            parentLinkSet.add(linkKey);
            result.parentLinked++;
          }
        }

        const className = strOrNull(row["수업"]);
        if (className) {
          const classId = classByName.get(className);
          if (!classId) {
            missingClassNames.add(className);
          } else {
            const linkKey = `${classId}__${studentId}`;
            if (!classLinkSet.has(linkKey)) {
              await prisma.classStudent.create({
                data: { classId, studentId },
              });
              classLinkSet.add(linkKey);
              result.classLinked++;
            }
          }
        }
      } catch (e) {
        result.errors.push({
          row: i + 2,
          name,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    result.classMissing = Array.from(missingClassNames);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Student import error:", error);
    return NextResponse.json(
      { error: "임포트 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
});
