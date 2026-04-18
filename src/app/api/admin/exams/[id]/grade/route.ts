import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyParents } from "@/lib/notify";
import { requireAdmin } from "@/lib/route-middleware";

type IdCtx = { params: Promise<{ id: string }> };

export const POST = requireAdmin(async (request, { params }: IdCtx) => {
  const { id } = await params;

  try {
    const { examineeId, answers, essayScores, comment, commentType } = await request.json();

    const examineeBefore = await prisma.examinee.findUnique({
      where: { id: examineeId },
      select: {
        isShared: true,
        student: {
          select: {
            name: true,
            parents: { select: { parentId: true } },
          },
        },
      },
    });

    const questions = await prisma.question.findMany({
      where: { examSessionId: id },
      orderBy: { questionNo: "asc" },
    });

    let totalScore = 0;

    for (const question of questions) {
      const studentAnswer = answers?.[question.id] || "";
      const isAnswered = studentAnswer.trim() !== "";

      let isCorrect: boolean | null = null;
      let score = 0;

      if (question.type === "OBJECTIVE") {
        isCorrect = isAnswered && studentAnswer.trim() === question.answer?.trim();
        score = isCorrect ? question.points : 0;
      } else {
        // 서술형: essayScores에서 수동 점수 가져오기
        score = essayScores?.[question.id] ?? 0;
        isCorrect = null;
      }

      totalScore += score;

      await prisma.studentAnswer.upsert({
        where: {
          examineeId_questionId: { examineeId, questionId: question.id },
        },
        update: {
          answer: studentAnswer || null,
          isCorrect,
          score,
          isAnswered,
        },
        create: {
          examineeId,
          questionId: question.id,
          answer: studentAnswer || null,
          isCorrect,
          score,
          isAnswered,
        },
      });
    }

    // 응시자 업데이트 (총점 + 교사 코멘트)
    await prisma.examinee.update({
      where: { id: examineeId },
      data: {
        totalScore,
        teacherComment: comment || null,
        commentType: commentType || "PARENT_VISIBLE",
      },
    });

    // SHARED 상태는 유지 (regression 방지)
    const session_ = await prisma.examSession.findUnique({
      where: { id },
      select: { status: true, name: true },
    });
    if (session_ && session_.status !== "SHARED") {
      await prisma.examSession.update({ where: { id }, data: { status: "GRADING" } });
    }

    // BR-E06: 학부모 공유된 응시자의 점수가 변경된 경우 "리포트 갱신" 알림
    if (examineeBefore?.isShared && session_) {
      await notifyParents({
        parentIds: examineeBefore.student.parents.map((p) => p.parentId),
        type: "EXAM",
        title: "시험 리포트가 갱신되었습니다",
        content: `${examineeBefore.student.name}의 ${session_.name} 결과가 수정되었습니다.`,
        linkUrl: `/parent/exams`,
      });
    }

    return NextResponse.json({ totalScore, message: "채점이 완료되었습니다." });
  } catch (error) {
    console.error("Grade error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
});
