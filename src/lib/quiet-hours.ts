// 야간 발송 제한 (BR-F03): 21:00 ~ 08:00 사이는 다음 허용 시각으로 reschedule

const QUIET_START_HOUR = 21; // 21:00 부터 차단
const QUIET_END_HOUR = 8; // 08:00 부터 허용
const RESUME_TIME_HHMM = "0810"; // 08:10에 일괄 발송

function isQuietHour(hour: number): boolean {
  return hour >= QUIET_START_HOUR || hour < QUIET_END_HOUR;
}

// 한국시간 기준으로 현재 시각이 야간시간이면 다음 발송 슬롯을 반환.
// 야간이 아니면 null.
export function getNextSendSlot(now: Date = new Date()): { rdate: string; rtime: string } | null {
  // 서버가 KST로 동작한다고 가정. 다른 TZ면 별도 보정 필요.
  const hour = now.getHours();
  if (!isQuietHour(hour)) return null;

  const target = new Date(now);
  if (hour >= QUIET_START_HOUR) {
    // 오늘 21:00 이후 → 내일 08:10
    target.setDate(target.getDate() + 1);
  }
  // 어떤 경우든 target날짜의 08:10
  target.setHours(8, 10, 0, 0);

  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, "0");
  const d = String(target.getDate()).padStart(2, "0");
  return { rdate: `${y}${m}${d}`, rtime: RESUME_TIME_HHMM };
}
