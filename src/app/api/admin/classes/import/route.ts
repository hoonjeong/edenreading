import { NextResponse } from "next/server";
import { ClassStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  parseExcel,
  str,
  strOrNull,
  num,
  numOrNull,
  parseExcelDate,
} from "@/lib/excel";
import { requireAdmin } from "@/lib/route-middleware";

function mapStatus(v: unknown): ClassStatus {
  const s = str(v);
  if (s.includes("종료")) return ClassStatus.INACTIVE;
  if (s.includes("중단") || s.includes("일시")) return ClassStatus.PAUSED;
  return ClassStatus.ACTIVE;
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

    const existingNames = new Set(
      (await prisma.class.findMany({ select: { name: true } })).map((c) => c.name)
    );

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: { row: number; name: string; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = str(row["수업명"]);
      if (!name) {
        skipped++;
        continue;
      }

      try {
        const data = {
          name,
          category: strOrNull(row["구분"]),
          fee: num(row["수업료"]),
          feePerSession: numOrNull(row["1회당수업료"]),
          targetGrade: strOrNull(row["대상"]),
          teacher: strOrNull(row["담임강사"]),
          assistantTeacher: strOrNull(row["보조강사"]),
          classroom: strOrNull(row["강의실"]),
          capacity: numOrNull(row["정원"]),
          startDate: parseExcelDate(row["시작일"]),
          endDate: parseExcelDate(row["종료일"]),
          status: mapStatus(row["상태"]),
        };

        await prisma.class.upsert({
          where: { name },
          update: data,
          create: data,
        });

        if (existingNames.has(name)) updated++;
        else created++;
      } catch (e) {
        errors.push({
          row: i + 2,
          name,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return NextResponse.json({
      total: rows.length,
      created,
      updated,
      skipped,
      errors,
    });
  } catch (error) {
    console.error("Class import error:", error);
    return NextResponse.json(
      { error: "임포트 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
});
