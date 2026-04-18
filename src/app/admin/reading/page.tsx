import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";

export default async function ReadingPage() {
  const records = await prisma.readingRecord.findMany({
    include: { student: true, photos: true },
    orderBy: { readDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">독서 기록</h1>
        <Link href="/admin/reading/new">
          <Button><Plus className="h-4 w-4 mr-2" />독서 등록</Button>
        </Link>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <BookOpen className="h-12 w-12 mx-auto mb-2" />
            <p>등록된 독서 기록이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <div className="w-16 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {record.coverPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={record.coverPhotoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="h-6 w-6 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{record.bookTitle}</p>
                    {record.bookAuthor && <p className="text-xs text-gray-500">{record.bookAuthor}</p>}
                    <p className="text-xs text-gray-500 mt-1">{record.student.name}</p>
                    <p className="text-xs text-gray-400">{new Date(record.readDate).toLocaleDateString("ko-KR")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
