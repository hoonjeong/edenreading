import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Image as ImageIcon } from "lucide-react";

export default async function ActivitiesPage() {
  const activities = await prisma.activity.findMany({
    include: {
      student: true,
      media: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">활동 기록</h1>
          <p className="text-gray-500 mt-1">총 {activities.length}개</p>
        </div>
        <Link href="/admin/activities/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            활동 기록
          </Button>
        </Link>
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <p>등록된 활동이 없습니다.</p>
            <Link href="/admin/activities/new" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              첫 활동 기록하기
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map((activity) => (
            <Link key={activity.id} href={`/admin/activities/${activity.id}/edit`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{activity.title}</span>
                      {activity.isEdited && (
                        <span className="text-xs text-gray-400">(수정됨)</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {activity.student.name} · {new Date(activity.activityDate).toLocaleDateString("ko-KR")}
                    </p>
                    {activity.content && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{activity.content}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-3">
                    {activity.isShared ? (
                      <Badge variant="success">공유됨</Badge>
                    ) : activity.isDraft ? (
                      <Badge variant="secondary">임시저장</Badge>
                    ) : (
                      <Badge variant="warning">미공유</Badge>
                    )}
                    {activity.media.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <ImageIcon className="h-3 w-3" />
                        {activity.media.length}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
