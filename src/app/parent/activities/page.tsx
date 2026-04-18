import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ImageIcon } from "lucide-react";

export default async function ParentActivitiesPage() {
  const session = await auth();
  if (!session) return null;

  const parent = await prisma.parent.findUnique({
    where: { phone: session.user.email },
    include: {
      children: {
        include: {
          student: {
            include: {
              activities: {
                where: { isShared: true },
                orderBy: { activityDate: "desc" },
                include: { media: { orderBy: { sortOrder: "asc" } } },
              },
            },
          },
        },
      },
    },
  });

  if (!parent) return null;

  const allActivities = parent.children
    .flatMap(({ student }) =>
      student.activities.map((a) => ({ ...a, studentName: student.name }))
    )
    .sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime());

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">활동 기록</h2>

      {allActivities.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-400">
            아직 공유된 활동이 없습니다.
          </CardContent>
        </Card>
      ) : (
        allActivities.map((activity) => (
          <Card key={activity.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                  {activity.studentName}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(activity.activityDate).toLocaleDateString("ko-KR")}
                </span>
                {activity.isEdited && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    수정됨
                  </span>
                )}
              </div>
              <h3 className="font-medium mb-2">{activity.title}</h3>
              {activity.content && (
                <p className="text-sm text-gray-600 mb-3">{activity.content}</p>
              )}

              {/* Media gallery */}
              {activity.media.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {activity.media.map((m) => (
                    <div key={m.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {m.type === "PHOTO" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <video src={m.url} controls className="w-full h-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
