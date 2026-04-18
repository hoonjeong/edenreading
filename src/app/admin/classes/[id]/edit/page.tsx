import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClassForm } from "@/components/admin/class-form";

function toDateInput(d: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      students: {
        include: { student: { select: { id: true, name: true, grade: true } } },
        orderBy: { enrolledAt: "asc" },
      },
    },
  });

  if (!cls) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">수업 수정</h1>

      <ClassForm
        classId={cls.id}
        initial={{
          name: cls.name,
          category: cls.category || "",
          fee: String(cls.fee ?? 0),
          feePerSession: cls.feePerSession != null ? String(cls.feePerSession) : "",
          targetGrade: cls.targetGrade || "",
          teacher: cls.teacher || "",
          assistantTeacher: cls.assistantTeacher || "",
          classroom: cls.classroom || "",
          capacity: cls.capacity != null ? String(cls.capacity) : "",
          startDate: toDateInput(cls.startDate),
          endDate: toDateInput(cls.endDate),
          status: cls.status,
        }}
      />

      <div className="bg-white rounded-xl border p-6 space-y-3">
        <h2 className="font-semibold text-gray-800">
          수강생 ({cls.students.length}명)
        </h2>
        {cls.students.length === 0 ? (
          <p className="text-sm text-gray-400">등록된 수강생이 없습니다.</p>
        ) : (
          <ul className="divide-y">
            {cls.students.map((s) => (
              <li key={s.student.id} className="py-2 text-sm flex justify-between">
                <span className="font-medium">{s.student.name}</span>
                <span className="text-gray-500">{s.student.grade || "-"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
