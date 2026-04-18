import { NotificationType } from "@prisma/client";
import { prisma } from "./prisma";
import { sendAligoSms, type AligoMsgType } from "./aligo";

export interface ParentNotifyInput {
  parentIds: string[];
  type: NotificationType;
  title: string;
  content: string;
  linkUrl?: string;
  // SMS 자동 발송 (notifySms=true 학부모만 대상)
  sms?: {
    message: string;
    msgType?: AligoMsgType;
    title?: string;
    testMode?: boolean;
  };
}

export interface ParentNotifyResult {
  notificationCount: number;
  smsAttempted: number;
  smsSucceeded: number;
  smsScheduled?: { rdate: string; rtime: string };
}

// 학부모에게 인앱 알림(Notification) 생성 + 옵션으로 SMS 발송.
// SMS는 notifySms=true 인 학부모에게만 BR-F03(야간 차단) 적용해 자동 reschedule.
export async function notifyParents(input: ParentNotifyInput): Promise<ParentNotifyResult> {
  const ids = Array.from(new Set(input.parentIds.filter(Boolean)));
  if (ids.length === 0) {
    return { notificationCount: 0, smsAttempted: 0, smsSucceeded: 0 };
  }

  await prisma.notification.createMany({
    data: ids.map((parentId) => ({
      parentId,
      type: input.type,
      title: input.title,
      content: input.content,
      linkUrl: input.linkUrl,
    })),
  });

  if (!input.sms) {
    return { notificationCount: ids.length, smsAttempted: 0, smsSucceeded: 0 };
  }

  const optedIn = await prisma.parent.findMany({
    where: { id: { in: ids }, notifySms: true },
    select: { phone: true },
  });
  const phones = optedIn.map((p) => p.phone).filter(Boolean);

  if (phones.length === 0) {
    return { notificationCount: ids.length, smsAttempted: 0, smsSucceeded: 0 };
  }

  const aligo = await sendAligoSms({
    receivers: phones,
    message: input.sms.message,
    type: input.sms.msgType,
    title: input.sms.title,
    testMode: input.sms.testMode,
    respectQuietHours: true,
  });

  return {
    notificationCount: ids.length,
    smsAttempted: phones.length,
    smsSucceeded: aligo.ok ? aligo.successCount : 0,
    smsScheduled: aligo.scheduled,
  };
}
