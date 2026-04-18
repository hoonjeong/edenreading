import { NextResponse } from "next/server";
import { MessageChannel, SmsType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { detectMsgType, sendAligoSms, type AligoMsgType } from "@/lib/aligo";
import { requireAdmin } from "@/lib/route-middleware";

interface SendBody {
  parentIds?: string[];
  phones?: string[]; // 학부모 외 직접 입력
  title?: string | null;
  content: string;
  type?: AligoMsgType;
  testMode?: boolean;
}

export const POST = requireAdmin(async (request, _ctx, session) => {
  let body: SendBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const content = (body.content || "").trim();
  if (!content) {
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
  }

  const parentIds = Array.isArray(body.parentIds) ? body.parentIds : [];
  const extraPhones = Array.isArray(body.phones) ? body.phones : [];

  const parents = parentIds.length
    ? await prisma.parent.findMany({
        where: { id: { in: parentIds } },
        select: { id: true, name: true, phone: true, notifySms: true },
      })
    : [];

  // BR-F04: notifySms=false 학부모는 SMS 발송에서 제외 (인앱 알림은 별도)
  const optedOut = parents.filter((p) => !p.notifySms);
  const optedIn = parents.filter((p) => p.notifySms);

  type Recipient = { phone: string; name: string | null; parentId: string | null };
  const seen = new Set<string>();
  const recipients: Recipient[] = [];
  for (const p of optedIn) {
    if (!p.phone || seen.has(p.phone)) continue;
    seen.add(p.phone);
    recipients.push({ phone: p.phone, name: p.name, parentId: p.id });
  }
  for (const raw of extraPhones) {
    const phone = (raw || "").replace(/\D/g, "");
    if (!phone || seen.has(phone)) continue;
    seen.add(phone);
    recipients.push({ phone, name: null, parentId: null });
  }

  if (recipients.length === 0 && optedOut.length === 0) {
    return NextResponse.json({ error: "수신자를 한 명 이상 선택해주세요." }, { status: 400 });
  }
  if (recipients.length > 1000) {
    return NextResponse.json(
      { error: "한 번에 최대 1,000명까지 발송 가능합니다." },
      { status: 400 }
    );
  }

  const msgType = body.type || detectMsgType(content);

  const aligo = recipients.length > 0
    ? await sendAligoSms({
        receivers: recipients.map((r) => r.phone),
        message: content,
        type: msgType,
        title: body.title || undefined,
        testMode: body.testMode,
        respectQuietHours: true,
      })
    : {
        ok: true,
        raw: null,
        rawText: "",
        resultCode: "0",
        resultMessage: "외부 발송 대상 없음 (모든 학부모가 SMS 수신 거부)",
        successCount: 0,
        errorCount: 0,
        scheduled: undefined,
      };

  const message = await prisma.message.create({
    data: {
      adminId: session.user.id,
      channel: MessageChannel.SMS,
      msgType: msgType as SmsType,
      title: body.title || null,
      content,
      senderPhone: process.env.ALIGO_SENDER_PHONE || null,
      recipientCount: recipients.length,
      successCount: aligo.successCount,
      failCount: aligo.errorCount,
      resultCode: aligo.resultCode,
      resultMessage: aligo.resultMessage,
      testMode: body.testMode ?? process.env.ALIGO_TEST_MODE === "Y",
      recipients: {
        create: recipients.map((r) => ({
          parentId: r.parentId,
          phone: r.phone,
          name: r.name,
          isSuccess: aligo.ok,
        })),
      },
    },
    select: { id: true },
  });

  // 인앱 알림은 SMS 수신거부 학부모에게도 생성
  if (parents.length > 0) {
    await prisma.notification.createMany({
      data: parents.map((p) => ({
        parentId: p.id,
        type: "MESSAGE" as const,
        title: body.title || "새 메시지",
        content,
      })),
    });
  }

  return NextResponse.json({
    ok: aligo.ok,
    messageId: message.id,
    msgType,
    recipientCount: recipients.length,
    successCount: aligo.successCount,
    failCount: aligo.errorCount,
    skippedOptOut: optedOut.length,
    scheduled: aligo.scheduled,
    resultMessage: aligo.scheduled
      ? `야간시간(21:00~08:00) 차단으로 ${aligo.scheduled.rdate} ${aligo.scheduled.rtime}에 예약 발송됩니다.`
      : aligo.resultMessage,
  });
});
