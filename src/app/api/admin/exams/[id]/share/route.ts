import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyParents } from "@/lib/notify";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.userType !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const { id } = await params;
  let body: { notifySms?: boolean } = {};
  try {
    body = await request.json();
  } catch {}

  const ungraded = await prisma.examinee.count({
    where: { examSessionId: id, totalScore: null, isAbsent: false },
  });

  if (ungraded > 0) {
    return NextResponse.json(
      { error: `채점되지 않은 학생이 ${ungraded}명 있습니다.` },
      { status: 400 }
    );
  }

  const exam = await prisma.examSession.findUnique({
    where: { id },
    include: {
      examinees: {
        where: { isAbsent: false },
        include: { student: { include: { parents: { select: { parentId: true } } } } },
      },
    },
  });

  if (!exam) {
    return NextResponse.json({ error: "시험을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.examinee.updateMany({
    where: { examSessionId: id },
    data: { isShared: true, sharedAt: new Date() },
  });

  await prisma.examSession.update({
    where: { id },
    data: { status: "SHARED" },
  });

  for (const examinee of exam.examinees) {
    await notifyParents({
      parentIds: examinee.student.parents.map((p) => p.parentId),
      type: "EXAM",
      title: "시험 결과가 도착했습니다",
      content: `${examinee.student.name}의 ${exam.name} 결과를 확인해보세요.`,
      linkUrl: `/parent/exams`,
      sms: body.notifySms
        ? { message: `[${examinee.student.name}] ${exam.name} 시험 결과가 공유되었습니다.` }
        : undefined,
    });
  }

  return NextResponse.json({ message: "학부모에게 공유되었습니다." });
}
