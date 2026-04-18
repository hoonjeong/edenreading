import { NextResponse } from "next/server";

export const API_ERRORS = {
  UNAUTHORIZED: "권한이 없습니다.",
  FORBIDDEN_DIRECTOR_ONLY: "원장만 수행할 수 있습니다.",
  FORBIDDEN_STUDENT: "담당 학생이 아닙니다.",
  SERVER: "서버 오류가 발생했습니다.",
  BAD_REQUEST: "잘못된 요청입니다.",
} as const;

export function apiError(message: string, status: number): Response {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown, context: string): Response {
  console.error(`${context}:`, error);
  return NextResponse.json({ error: API_ERRORS.SERVER }, { status: 500 });
}
