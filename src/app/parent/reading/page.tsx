import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default async function ParentReadingPage() {
  const session = await auth();
  if (!session) return null;

  const parent = await prisma.parent.findUnique({
    where: { phone: session.user.email },
    include: {
      children: {
        include: {
          student: {
            include: {
              readingRecords: {
                where: { isShared: true },
                orderBy: { readDate: "desc" },
                include: { photos: { orderBy: { sortOrder: "asc" } } },
              },
            },
          },
        },
      },
    },
  });

  if (!parent) return null;

  const allRecords = parent.children.flatMap(({ student }) =>
    student.readingRecords.map((r) => ({ ...r, studentName: student.name }))
  ).sort((a, b) => new Date(b.readDate).getTime() - new Date(a.readDate).getTime());

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">독서 기록</h2>

      {allRecords.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-400">
            <BookOpen className="h-12 w-12 mx-auto mb-2" />
            <p>공유된 독서 기록이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {allRecords.map((record) => (
            <Card key={record.id} className="overflow-hidden">
              <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center overflow-hidden">
                {record.coverPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={record.coverPhotoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="h-10 w-10 text-gray-300" />
                )}
              </div>
              <CardContent className="p-3">
                <p className="font-medium text-sm truncate">{record.bookTitle}</p>
                {record.bookAuthor && <p className="text-xs text-gray-500">{record.bookAuthor}</p>}
                <p className="text-xs text-gray-400 mt-1">{new Date(record.readDate).toLocaleDateString("ko-KR")}</p>
                <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">{record.studentName}</span>
                {record.teacherNote && (
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{record.teacherNote}</p>
                )}
                {record.photos.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {record.photos.slice(0, 3).map((p) => (
                      <div key={p.id} className="w-8 h-8 rounded overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {record.photos.length > 3 && <span className="text-xs text-gray-400 self-center">+{record.photos.length - 3}</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
