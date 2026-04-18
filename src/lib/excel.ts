import * as XLSX from "xlsx";

export type ExcelRow = Record<string, string | number | boolean | null>;

export function parseExcel(buffer: Buffer): ExcelRow[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: "", raw: true });
  return rows.map((r) => {
    const out: ExcelRow = {};
    for (const k of Object.keys(r)) {
      out[k.trim()] = r[k];
    }
    return out;
  });
}

export function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

export function strOrNull(v: unknown): string | null {
  const s = str(v);
  return s === "" ? null : s;
}

export function num(v: unknown): number {
  if (v == null || v === "") return 0;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function numOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

// 지원 형식: "20250213", "2025-02-13", "2025-02-13 13:37:08.0"
export function parseExcelDate(v: unknown): Date | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (s === "") return null;

  if (/^\d{8}$/.test(s)) {
    const y = Number(s.slice(0, 4));
    const m = Number(s.slice(4, 6));
    const d = Number(s.slice(6, 8));
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(s);
  if (!isNaN(date.getTime())) return date;

  const m = s.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return null;
}

export function cleanPhone(v: unknown): string | null {
  const s = str(v).replace(/\D/g, "");
  return s === "" ? null : s;
}
