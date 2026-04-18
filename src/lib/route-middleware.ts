import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "./auth";

type Handler<Context> = (
  request: Request,
  context: Context,
  session: Session
) => Promise<Response> | Response;

type AdminOptions = {
  directorOnly?: boolean;
};

export function requireAdmin<Context = unknown>(
  handler: Handler<Context>,
  options: AdminOptions = {}
) {
  return async (request: Request, context: Context): Promise<Response> => {
    const session = await auth();
    if (!session || session.user.userType !== "admin") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
    }
    if (options.directorOnly && session.user.role !== "DIRECTOR") {
      return NextResponse.json({ error: "원장만 수행할 수 있습니다." }, { status: 403 });
    }
    return handler(request, context, session);
  };
}

export function requireParent<Context = unknown>(handler: Handler<Context>) {
  return async (request: Request, context: Context): Promise<Response> => {
    const session = await auth();
    if (!session || session.user.userType !== "parent") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
    }
    return handler(request, context, session);
  };
}

export function requireAuth<Context = unknown>(handler: Handler<Context>) {
  return async (request: Request, context: Context): Promise<Response> => {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
    }
    return handler(request, context, session);
  };
}
