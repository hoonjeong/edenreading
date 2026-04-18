import { ClassStatus, type Prisma } from "@prisma/client";

function numOrNull(v: unknown): number | null {
  return v != null && v !== "" ? Number(v) : null;
}

function dateOrNull(v: unknown): Date | null {
  return v ? new Date(v as string) : null;
}

export function classDataFromBody(body: Record<string, unknown>): Prisma.ClassUncheckedCreateInput {
  return {
    name: body.name as string,
    category: (body.category as string) || null,
    fee: body.fee != null ? Number(body.fee) : 0,
    feePerSession: numOrNull(body.feePerSession),
    targetGrade: (body.targetGrade as string) || null,
    teacher: (body.teacher as string) || null,
    assistantTeacher: (body.assistantTeacher as string) || null,
    classroom: (body.classroom as string) || null,
    capacity: numOrNull(body.capacity),
    startDate: dateOrNull(body.startDate),
    endDate: dateOrNull(body.endDate),
    status: (body.status as ClassStatus) || ClassStatus.ACTIVE,
  };
}
