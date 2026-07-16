// 마감일을 캘린더(.ics)로 내보내기 — 서버 없이 브라우저에서 파일 생성

function esc(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

const ymd = (d: Date) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;

/**
 * 마감일 종일 일정 + 하루 전 알림.
 * @param endDate YYYY-MM-DD
 */
export function buildIcs(opts: {
  id: string;
  title: string;
  endDate: string;
  url: string;
  org?: string;
}): string {
  const end = new Date(opts.endDate + "T00:00:00");
  const next = new Date(end);
  next.setDate(next.getDate() + 1); // 종일 일정의 DTEND 는 다음 날

  const stamp = ymd(new Date()) + "T000000Z";
  const desc = [`신청 마감일입니다.`, opts.org ? `기관: ${opts.org}` : "", opts.url]
    .filter(Boolean)
    .join("\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//kkulcheong//policy//KR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${opts.id}@kkulcheong.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(end)}`,
    `DTEND;VALUE=DATE:${ymd(next)}`,
    `SUMMARY:${esc("[마감] " + opts.title)}`,
    `DESCRIPTION:${esc(desc)}`,
    `URL:${esc(opts.url)}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D", // 하루 전 알림
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc("내일 마감: " + opts.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
