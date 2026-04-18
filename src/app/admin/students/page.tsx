import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function StudentsPage() {
  const students = await prisma.student.findMany({
    include: {
      parents: { include: { parent: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">학생 관리</h1>
          <p className="text-gray-500 mt-1">등록된 학생 {students.length}명</p>
        </div>
        <Link href="/admin/students/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            학생 등록
          </Button>
        </Link>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <p>등록된 학생이 없습니다.</p>
            <Link href="/admin/students/new" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              첫 학생 등록하기
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <Link key={student.id} href={`/admin/students/${student.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                      {student.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{student.name}</p>
                        {!student.isActive && <Badge variant="secondary">비활성</Badge>}
                      </div>
                      <p className="text-sm text-gray-500">{student.grade || "학년 미지정"}</p>
                    </div>
                  </div>
                  {student.parents.length > 0 && (
                    <div className="mt-3 text-xs text-gray-500">
                      학부모: {student.parents.map((p) => p.parent.name).join(", ")}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
