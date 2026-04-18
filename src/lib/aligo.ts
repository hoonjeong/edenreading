// Aligo SMS API 클라이언트 (https://smartsms.aligo.in/smsapi.html)

const ALIGO_API_URL = process.env.ALIGO_API_URL || "https://apis.aligo.in/send/";

export type AligoMsgType = "SMS" | "LMS" | "MMS";

export interface AligoSendOptions {
  receivers: string[]; // 수신자 전화번호 배열 (최대 1000)
  message: string;
  type?: AligoMsgType;
  title?: string; // LMS/MMS only
  testMode?: boolean;
  rdate?: string; // 예약일 YYYYMMDD
  rtime?: string; // 예약시간 HHMM (현재시간 기준 10분 이후)
  respectQuietHours?: boolean; // true이면 21:00~08:00 사이일 때 다음날 08:10으로 자동 예약
}

export interface AligoResponse {
  result_code: number; // 1 이상이면 성공, 음수는 실패
  message: string;
  msg_id?: number;
  success_cnt?: number;
  error_cnt?: number;
  msg_type?: string;
}

export interface AligoSendResult {
  ok: boolean;
  raw: AligoResponse | null;
  rawText: string;
  resultCode: string;
  resultMessage: string;
  successCount: number;
  errorCount: number;
  scheduled?: { rdate: string; rtime: string }; // 야간차단으로 예약된 경우
}

export function getByteLength(str: string): number {
  let bytes = 0;
  for (let i = 0; i < str.length; i++) {
    bytes += str.charCodeAt(i) > 0x7f ? 2 : 1;
  }
  return bytes;
}

export function detectMsgType(message: string): AligoMsgType {
  return getByteLength(message) <= 90 ? "SMS" : "LMS";
}

export function isAligoConfigured(): boolean {
  return !!(process.env.ALIGO_API_KEY && process.env.ALIGO_USER_ID && process.env.ALIGO_SENDER_PHONE);
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

export async function sendAligoSms(opts: AligoSendOptions): Promise<AligoSendResult> {
  const apiKey = process.env.ALIGO_API_KEY;
  const userId = process.env.ALIGO_USER_ID;
  const sender = process.env.ALIGO_SENDER_PHONE;
  const envTestMode = process.env.ALIGO_TEST_MODE === "Y";

  if (!apiKey || !userId || !sender) {
    return {
      ok: false,
      raw: null,
      rawText: "",
      resultCode: "0",
      resultMessage: "Aligo 환경변수(ALIGO_API_KEY/USER_ID/SENDER_PHONE)가 설정되지 않았습니다.",
      successCount: 0,
      errorCount: opts.receivers.length,
    };
  }

  const receivers = opts.receivers.map(digitsOnly).filter(Boolean);
  if (receivers.length === 0) {
    return {
      ok: false,
      raw: null,
      rawText: "",
      resultCode: "0",
      resultMessage: "수신자가 비어 있습니다.",
      successCount: 0,
      errorCount: 0,
    };
  }

  const type = opts.type || detectMsgType(opts.message);
  const useTest = opts.testMode ?? envTestMode;

  let rdate = opts.rdate;
  let rtime = opts.rtime;
  let scheduled: { rdate: string; rtime: string } | undefined;
  if (!rdate && !rtime && opts.respectQuietHours) {
    const { getNextSendSlot } = await import("./quiet-hours");
    const slot = getNextSendSlot();
    if (slot) {
      rdate = slot.rdate;
      rtime = slot.rtime;
      scheduled = slot;
    }
  }

  const params = new URLSearchParams({
    key: apiKey,
    user_id: userId,
    sender: digitsOnly(sender),
    receiver: receivers.join(","),
    msg: opts.message,
    msg_type: type,
  });
  if (opts.title && (type === "LMS" || type === "MMS")) {
    params.set("title", opts.title.slice(0, 44));
  }
  if (useTest) params.set("testmode_yn", "Y");
  if (rdate) params.set("rdate", rdate);
  if (rtime) params.set("rtime", rtime);

  let rawText = "";
  let raw: AligoResponse | null = null;

  try {
    const response = await fetch(ALIGO_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    rawText = await response.text();
    try {
      raw = JSON.parse(rawText) as AligoResponse;
    } catch {
      raw = null;
    }
  } catch (e) {
    return {
      ok: false,
      raw: null,
      rawText: e instanceof Error ? e.message : String(e),
      resultCode: "0",
      resultMessage: "Aligo API 호출 실패",
      successCount: 0,
      errorCount: receivers.length,
    };
  }

  const ok = !!raw && raw.result_code > 0;
  return {
    ok,
    raw,
    rawText,
    resultCode: String(raw?.result_code ?? 0),
    resultMessage: raw?.message || (ok ? "success" : "failed"),
    successCount: raw?.success_cnt ?? (ok ? receivers.length : 0),
    errorCount: raw?.error_cnt ?? (ok ? 0 : receivers.length),
    scheduled,
  };
}
