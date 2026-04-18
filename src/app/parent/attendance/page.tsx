import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default async function ParentAttendancePage() {
  const session = await auth();
  if (!session) return null;

  const parent = await prisma.parent.findUnique({
    where: { phone: session.user.email },
    include: {
      children: {
        include: {
          student: {
            include: {
              attendances: {
                orderBy: { date: "desc" },
                take: 30,
              },
            },
          },
        },
      },
    },
  });

  if (!parent) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">출석 확인</h2>

      {parent.children.map(({ student }) => {
        const presentCount = student.attendances.filter((a) => a.status === "PRESENT").length;
        const total = student.attendances.length;
        const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

        return (
          <Card key={student.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                  {student.name[0]}
                </div>
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-gray-500">출석률 {rate}%</p>
                </div>
              </div>

              {student.attendances.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">출석 기록이 없습니다.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {student.attendances.map((att) => (
                    <div
                      key={att.id}
                      className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
                        att.status === "PRESENT"
                          ? "bg-green-100 text-green-700"
                          : att.status === "TARDY"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                      title={`${new Date(att.date).toLocaleDateString("ko-KR")} - ${
                        att.status === "PRESENT" ? "출석" : att.status === "TARDY" ? "지각" : "결석"
                      }`}
                    >
                      {new Date(att.date).getDate()}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
