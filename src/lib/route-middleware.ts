import type { Session } from "next-auth";
import { auth } from "./auth";
import { API_ERRORS, apiError } from "./errors";

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
      return apiError(API_ERRORS.UNAUTHORIZED, 401);
    }
    if (options.directorOnly && session.user.role !== "DIRECTOR") {
      return apiError(API_ERRORS.FORBIDDEN_DIRECTOR_ONLY, 403);
    }
    return handler(request, context, session);
  };
}

export function requireParent<Context = unknown>(handler: Handler<Context>) {
  return async (request: Request, context: Context): Promise<Response> => {
    const session = await auth();
    if (!session || session.user.userType !== "parent") {
      return apiError(API_ERRORS.UNAUTHORIZED, 401);
    }
    return handler(request, context, session);
  };
}

export function requireAuth<Context = unknown>(handler: Handler<Context>) {
  return async (request: Request, context: Context): Promise<Response> => {
    const session = await auth();
    if (!session) {
      return apiError(API_ERRORS.UNAUTHORIZED, 401);
    }
    return handler(request, context, session);
  };
}
